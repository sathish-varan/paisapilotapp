/* =====================================================
   Personal Money Tracker — Offline IndexedDB + Auto-Sync with Laptop SQLite
   ===================================================== */

const DB_NAME = 'MyPersonalMoneyDB';
const DB_VERSION = 1;
const STORE_NAME = 'walletStore';

let db = null;
let walletState = {
  cash: 0,
  gpay: 0,
  cashHistory: [],
  gpayHistory: []
};

// 1. Initialize IndexedDB (for 100% offline mobile use)
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const dbInstance = e.target.result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };

    request.onerror = (e) => {
      console.error('IndexedDB error:', e);
      reject(e);
    };
  });
}

function saveToDB(key, data) {
  return new Promise((resolve, reject) => {
    if (!db) return resolve();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ key: key, value: data });
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e);
  });
}

function loadFromDB(key) {
  return new Promise((resolve) => {
    if (!db) return resolve(null);
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => {
      resolve(request.result ? request.result.value : null);
    };
    request.onerror = () => resolve(null);
  });
}

// 2. Server Sync Functions (Syncs phone with laptop SQLite DB)
async function syncWithServer() {
  try {
    const res = await fetch('/api/sync', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json && json.data) {
        walletState = json.data;
        await saveToDB('walletState', walletState);
        await saveToDB('setupDone', true);
        return true;
      }
    }
  } catch (err) {
    // Laptop server not reachable (offline on phone)
    console.log('Laptop sync offline, using local storage.');
  }
  return false;
}

async function pushToServer() {
  // Always save locally first so it works 100% offline
  await saveToDB('walletState', walletState);
  await saveToDB('setupDone', true);

  // Then try pushing to laptop server
  try {
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(walletState)
    });
  } catch (err) {
    console.log('Saved locally. Will sync to laptop next time connected.');
  }
}

// 3. App Initialization
document.addEventListener('DOMContentLoaded', async () => {
  await initDB();

  // Try fetching latest data from laptop first
  const synced = await syncWithServer();

  // If laptop sync didn't yield data, load from phone's local database
  if (!synced) {
    const localState = await loadFromDB('walletState');
    if (localState) {
      walletState = localState;
    }
  }

  const setupDone = (await loadFromDB('setupDone')) === true || (walletState.cash > 0 || walletState.gpay > 0);

  if (setupDone) {
    showScreen('mainScreen');
    renderDashboard();
  } else {
    showScreen('setupScreen');
  }

  // Setup button
  document.getElementById('saveSetupBtn').addEventListener('click', handleSaveSetup);

  // Tabs
  document.getElementById('tabBtnCash').addEventListener('click', () => switchTab('cash'));
  document.getElementById('tabBtnGpay').addEventListener('click', () => switchTab('gpay'));

  // Download Excel
  document.getElementById('downloadExcelBtn').addEventListener('click', downloadExcelData);

  // 5 AM Morning Reminder Toggle
  const reminderBtn = document.getElementById('morningReminderBtn');
  initMorningReminderUI(reminderBtn);
  reminderBtn.addEventListener('click', toggleMorningReminder);

  // Reset Button
  document.getElementById('resetAppBtn').addEventListener('click', async () => {
    if (confirm('Reset starting amounts? This will let you enter your starting Cash and GPay again.')) {
      await saveToDB('setupDone', false);
      walletState = { cash: 0, gpay: 0, cashHistory: [], gpayHistory: [] };
      await pushToServer();
      showScreen('setupScreen');
      document.getElementById('setupCashInput').value = '';
      document.getElementById('setupGpayInput').value = '';
    }
  });

  // Offline service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
});

function showScreen(screenId) {
  document.getElementById('setupScreen').classList.toggle('hidden', screenId !== 'setupScreen');
  document.getElementById('mainScreen').classList.toggle('hidden', screenId !== 'mainScreen');
}

async function handleSaveSetup() {
  const cashVal = parseFloat(document.getElementById('setupCashInput').value) || 0;
  const gpayVal = parseFloat(document.getElementById('setupGpayInput').value) || 0;

  if (cashVal === 0 && gpayVal === 0) {
    showToast('Please enter your starting amount for Cash or GPay.');
    return;
  }

  walletState.cash = cashVal;
  walletState.gpay = gpayVal;

  walletState.cashHistory = [
    { label: 'Starting Balance', amount: cashVal, date: new Date().toISOString() }
  ];

  walletState.gpayHistory = [
    { label: 'Starting Balance', amount: gpayVal, date: new Date().toISOString() }
  ];

  // Save to both phone IndexedDB and laptop SQLite database
  await pushToServer();

  showScreen('mainScreen');
  renderDashboard();
  showToast('Starting amount saved & synced! ✅');
}

function switchTab(tabName) {
  const isCash = tabName === 'cash';

  document.getElementById('tabBtnCash').classList.toggle('active', isCash);
  document.getElementById('tabBtnGpay').classList.toggle('active', !isCash);

  document.getElementById('cashTabContent').classList.toggle('active', isCash);
  document.getElementById('gpayTabContent').classList.toggle('active', !isCash);
}

function renderDashboard() {
  const total = walletState.cash + walletState.gpay;

  document.getElementById('totalBalanceVal').textContent = formatINR(total);
  document.getElementById('cashBalanceVal').textContent = formatINR(walletState.cash);
  document.getElementById('gpayBalanceVal').textContent = formatINR(walletState.gpay);

  renderList('cashList', walletState.cashHistory);
  renderList('gpayList', walletState.gpayHistory);
}

function renderList(containerId, list) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!list || list.length === 0) {
    container.innerHTML = `<div class="empty-notice">No entries yet.</div>`;
    return;
  }

  container.innerHTML = list.map(item => `
    <div class="tx-item">
      <div>
        <div class="tx-label">${item.label}</div>
        <div class="tx-date">${formatDate(item.date)}</div>
      </div>
      <div class="tx-amount add">+${formatINR(item.amount)}</div>
    </div>
  `).join('');
}

function formatINR(n) {
  const num = Math.max(0, parseFloat(n) || 0);
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 2200);
}

// 5 AM Reminder Logic
function initMorningReminderUI(btn) {
  const isEnabled = localStorage.getItem('morning_reminder_5am') === 'true';
  updateReminderBtnUI(btn, isEnabled);
  if (isEnabled) {
    scheduleNext5AmNotification();
  }
}

function updateReminderBtnUI(btn, isEnabled) {
  if (isEnabled) {
    btn.textContent = '🔔 5:00 AM Daily Reminder: ON';
    btn.classList.add('active');
  } else {
    btn.textContent = '🔕 5:00 AM Daily Reminder: OFF';
    btn.classList.remove('active');
  }
}

async function toggleMorningReminder() {
  const btn = document.getElementById('morningReminderBtn');
  const currentState = localStorage.getItem('morning_reminder_5am') === 'true';

  if (!currentState) {
    if (!('Notification' in window)) {
      alert('Notifications are not supported in this browser.');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem('morning_reminder_5am', 'true');
      updateReminderBtnUI(btn, true);
      scheduleNext5AmNotification();
      showToast('⏰ 5:00 AM Daily Reminder Enabled!');
    } else {
      alert('Please allow notification permission to enable the 5 AM morning reminder.');
    }
  } else {
    localStorage.setItem('morning_reminder_5am', 'false');
    updateReminderBtnUI(btn, false);
    showToast('5 AM Reminder turned off.');
  }
}

function scheduleNext5AmNotification() {
  const now = new Date();
  const next5Am = new Date();

  next5Am.setHours(5, 0, 0, 0);

  // If 5 AM has already passed today, set it for tomorrow at 5 AM
  if (now.getTime() >= next5Am.getTime()) {
    next5Am.setDate(next5Am.getDate() + 1);
  }

  const msUntil5Am = next5Am.getTime() - now.getTime();

  setTimeout(() => {
    triggerMorningNotification();
    setInterval(triggerMorningNotification, 24 * 60 * 60 * 1000);
  }, msUntil5Am);
}

function triggerMorningNotification() {
  if (Notification.permission === 'granted') {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification('☀️ Good Morning! Time to Log Your Money', {
          body: 'Tap here to update your daily earnings and expenses.',
          icon: './icon-192.png',
          badge: './icon-192.png',
          vibrate: [200, 100, 200],
          requireInteraction: true
        });
      });
    } else {
      new Notification('☀️ Good Morning! Time to Log Your Money', {
        body: 'Tap here to update your daily earnings and expenses.',
        icon: './icon-192.png',
        requireInteraction: true
      });
    }
  }
}

// Download Excel completely offline
function downloadExcelData() {
  const rows = [];
  rows.push(['Wallet Type', 'Description / Source', 'Amount (INR)', 'Date']);

  if (walletState.cashHistory && walletState.cashHistory.length > 0) {
    walletState.cashHistory.forEach(item => {
      rows.push(['Cash', `"${(item.label || '').replace(/"/g, '""')}"`, item.amount, `"${new Date(item.date).toLocaleString('en-IN')}"`]);
    });
  }

  if (walletState.gpayHistory && walletState.gpayHistory.length > 0) {
    walletState.gpayHistory.forEach(item => {
      rows.push(['GPay', `"${(item.label || '').replace(/"/g, '""')}"`, item.amount, `"${new Date(item.date).toLocaleString('en-IN')}"`]);
    });
  }

  rows.push([]);
  rows.push(['Current Cash Balance', '', walletState.cash, '']);
  rows.push(['Current GPay Balance', '', walletState.gpay, '']);
  rows.push(['Total Money', '', walletState.cash + walletState.gpay, '']);

  const csvContent = '\uFEFF' + rows.map(e => e.join(',')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  const today = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `My_Money_Tracker_${today}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast('📥 Excel file downloaded!');
}
