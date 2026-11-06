# 💰 Daily Expense & Income Tracker

A fast, lightweight, and modern application designed specifically for **smartphones** (and desktops) to calculate your daily expenses, track your income sources, and understand exactly how you spend your money.

---

## 🚫 Do You Need Flutter, Android Studio, or App Stores?
**NO! You do NOT need Flutter, Node.js, Android Studio, or Xcode.**

This application is built as a **Progressive Web App (PWA)**:
- Works directly inside your mobile browser (**Safari on iPhone**, **Chrome on Android**).
- Can be saved to your phone's home screen with 1 tap, where it looks and behaves **exactly like a native mobile app** (app icon, full-screen, no URL bar).
- **100% Offline Capability**: All your data is saved securely in your phone's storage (`localStorage`), so it works even without internet.
- Zero installation or compilation headaches.

---

## 🚀 How to Run and Use It on Your Smartphone

### Method 1: On Your Local Wi-Fi (Quickest & Private)
1. Double-click **`start_app.bat`** on your computer (or run `python serve.py` in terminal).
2. The server will start and display your smartphone address:
   ```text
   http://<your-computer-ip>:8000
   ```
   *(For example: `http://10.224.231.130:8000`)*
3. Make sure your smartphone is connected to the same Wi-Fi network.
4. On your PC screen, click the **📱 phone icon** in the top right of the app to display a **scannable QR code** and point your phone camera at it (or type the address in your phone's browser).
5. **Install on Phone Screen:**
   - **iPhone (Safari):** Tap the **Share** button (box with arrow pointing up) ➔ Scroll down and tap **"Add to Home Screen"**.
   - **Android (Chrome):** Tap the **⋮** menu (top right) ➔ Tap **"Install app"** or **"Add to Home screen"**.

### Method 2: Free Cloud Hosting (Use Anywhere on 4G/5G)
If you want to use it outside your home Wi-Fi:
- Upload these files (`index.html`, `styles.css`, `app.js`, `manifest.json`, `sw.js`, icons) to **GitHub Pages**, **Netlify**, or **Vercel** (all 100% free).
- You get a permanent `https://your-name.netlify.app` link that you can open and install on your phone anywhere in the world!

---

## ✨ Features Included

### 1. 📅 Daily Expense Calculator
- **Today's Spending:** Live count of how much money you spent today.
- **Daily Average Pace:** Compares your spending today against your monthly average (indicates if your daily pace is Normal, Low, or High).
- **Date Filtering:** Instantly filter expenses for *Today*, *Yesterday*, *This Week*, *This Month*, or *All Time*.

### 2. 💵 Income Money Sources
- Track where your money comes from with dedicated source tags:
  - 💼 Salary / Wages
  - 💻 Freelance & Contracts
  - 🏢 Business & Sales
  - 📈 Investments & Dividends
  - 🏠 Rental Income
  - ⚡ Side Hustles
  - 🎁 Gifts & Grants
  - 🏷️ Custom Sources
- Visual source breakdown cards showing total amounts and percentage share of your total earnings.

### 3. 📊 How You Spend Your Money (Analytics & Breakdown)
- **Categorized Spending:**
  - 🍔 Food & Dining, 🛒 Groceries, 🚗 Transport & Fuel, 🏠 Housing & Rent, 💡 Bills & Utilities, 🛍️ Shopping, 🎬 Entertainment, 💊 Health & Medical, 📚 Education, 💅 Personal Care, ✈️ Travel.
- **Interactive Visual Charts:**
  - **Donut Chart:** Visual breakdown of spending by category with percentage distribution.
  - **Daily Spending Trend:** Day-by-day bar chart showing spending spikes and trends.
  - **Cash Flow Meter:** Visual comparison of Total Income vs. Total Expenses and Net Savings Rate.
  - **Payment Methods:** Breakdown of spending by Cash, Credit Card, Debit Card, UPI / Online, and Bank Transfer.

### 4. ⚙️ Data & Utilities
- **Multi-Currency:** Select `$ (USD)`, `₹ (INR)`, `€ (EUR)`, `£ (GBP)`, `¥ (JPY)`, `AED`, etc. in Settings.
- **Export to CSV:** Download your expense history for Excel or Google Sheets.
- **Backup & Restore:** Save a `.json` backup file or restore your past records at any time.
- **Preloaded Sample Data:** Includes realistic sample records to see how it works immediately; can be cleared or reloaded anytime.

