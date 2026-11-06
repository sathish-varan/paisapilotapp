"""
Personal Money Tracker — Python SQLite Sync Server
Runs on your laptop. Stores your data in 'money_data.db'.
Accessible from both your laptop and smartphone.
"""

import http.server
import socket
import socketserver
import webbrowser
import sqlite3
import json
import os
import sys

PORT = 8000
DB_FILE = "money_data.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS wallet_data (
            id INTEGER PRIMARY KEY,
            payload TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def get_wallet_state():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('SELECT payload FROM wallet_data WHERE id = 1')
    row = c.fetchone()
    conn.close()
    if row and row[0]:
        try:
            return json.loads(row[0])
        except Exception:
            return None
    return None

def set_wallet_state(state_dict):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    payload = json.dumps(state_dict)
    c.execute('''
        INSERT INTO wallet_data (id, payload, updated_at) 
        VALUES (1, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = CURRENT_TIMESTAMP
    ''', (payload,))
    conn.commit()
    conn.close()

class SyncRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS and disable caching for sync API
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path == '/api/sync':
            state = get_wallet_state()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'ok', 'data': state}).encode('utf-8'))
            return
        super().do_GET()

    def do_POST(self):
        if self.path == '/api/sync':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                set_wallet_state(data)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'ok', 'message': 'Saved to laptop SQLite'}).encode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'error', 'message': str(e)}).encode('utf-8'))
            return
        super().do_POST()

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    init_db()

    ip = get_local_ip()
    phone_url = f"http://{ip}:{PORT}"
    laptop_url = f"http://localhost:{PORT}"

    print("=" * 60)
    print("      PERSONAL MONEY TRACKER (SQLITE SYNC SERVER)")
    print("=" * 60)
    print(f"\n[+] LAPTOP URL:     {laptop_url}")
    print(f"[+] SMARTPHONE URL: {phone_url}")
    print(f"\n[+] SQLite Database: {os.path.join(script_dir, DB_FILE)}")
    print("\nHow it works:")
    print("  1. Update anything on your phone -> instantly saves to your laptop database.")
    print("  2. Open the Laptop URL on your PC -> shows the exact same money & history.")
    print("  3. Phone also saves offline in IndexedDB when you are away from Wi-Fi.")
    print("=" * 60)
    print("\nOpening on laptop browser...\n")

    webbrowser.open(laptop_url)

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), SyncRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
            sys.exit(0)

if __name__ == "__main__":
    main()
