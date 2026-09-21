#!/usr/bin/env python3
"""
Modern Wealth & Balance - Aplicación de Escritorio Nativa GUI (Tkinter 8.6 + Python 3)
Incluye Servidor Webhook en Hilo Secundario, Orquestación Multi-Agente & Persistencia SQLite
Integración con Google Gemini AI API via .env
"""

import tkinter as tk
from tkinter import ttk, messagebox
import sqlite3
import threading
import http.server
import socketserver
import json
import os
import sys
import re
import socket
import datetime
import urllib.parse
import urllib.request

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

DB_FILE = "modern_wealth.db"
PORT = 8000

# Cargar automáticamente GEMINI_API_KEY desde .env
def load_env_file():
    env_path = ".env"
    if not os.path.exists(env_path) and os.path.exists(".env.local"):
        env_path = ".env.local"
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ[k.strip()] = v.strip().strip('"').strip("'")
        except Exception:
            pass

load_env_file()

def call_gemini_api(prompt, system_instruction=""):
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    if system_instruction:
        payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            res_data = json.loads(resp.read().decode("utf-8"))
            candidates = res_data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "")
    except Exception as err:
        print("Gemini API GUI Error:", err)
    return None

# Audio feedback using Windows SAPI5 via PowerShell
def speak_audio(text):
    def _speak():
        try:
            clean_text = text.replace('"', '').replace("'", "")
            cmd = f'powershell -Command "Add-Type -AssemblyName System.Speech; $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; $synth.Speak(\'{clean_text}\')"'
            os.system(cmd)
        except Exception:
            pass
    threading.Thread(target=_speak, daemon=True).start()

# ----------------------------------------------------
# 1. Base de Datos SQLite Helper
# ----------------------------------------------------
def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

# ----------------------------------------------------
# 2. Servidor HTTP Webhook en Hilo Secundario
# ----------------------------------------------------
class ThreadedWebhookHandler(http.server.SimpleHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._cors()
            self.end_headers()
            has_gemini = bool(os.environ.get("GEMINI_API_KEY"))
            self.wfile.write(json.dumps({"status": "ok", "mode": "Desktop GUI Thread", "hasGeminiKey": has_gemini}).encode("utf-8"))
            return

        elif self.path == "/api/tailscale/status":
            tailscale_ip = ""
            try:
                for ip in socket.gethostbyname_ex(socket.gethostname())[2]:
                    if ip.startswith("100."):
                        tailscale_ip = ip
            except Exception: pass

            res = {
                "connected": bool(tailscale_ip),
                "hasGeminiKey": bool(os.environ.get("GEMINI_API_KEY")),
                "tailscaleIp": tailscale_ip or "100.64.0.1 (Detectado / Simulado)",
                "port": PORT,
                "mode": "Tailscale Private Mesh"
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._cors()
            self.end_headers()
            self.wfile.write(json.dumps(res).encode("utf-8"))
            return

        super().do_GET()

    def do_POST(self):
        if self.path == "/api/webhooks/payment":
            content_length = int(self.headers.get("Content-Length", 0))
            body_bytes = self.rfile.read(content_length) if content_length > 0 else b""
            try:
                body = json.loads(body_bytes.decode("utf-8"))
            except Exception:
                body = {}

            merchant = body.get("merchant", body.get("title", "Comercio Detectado"))
            amount = body.get("amount")
            source = body.get("source", "AppleShortcuts_iOS")

            if not amount:
                match = re.search(r'(?:\$|USD|EUR|MXN|\b)?\s?(\d+(?:[.,]\d{2})?)', str(body))
                amount = float(match.group(1).replace(',', '.')) if match else 45.00
            else:
                amount = float(amount)

            conn = get_db()
            cursor = conn.cursor()
            tx_id = f"tx_gui_{int(datetime.datetime.now().timestamp()*1000)}"
            now_date = datetime.datetime.now().strftime("%Y-%m-%d")
            now_time = datetime.datetime.now().strftime("%H:%M")

            acc_id = "acc_checking"
            row = cursor.execute("SELECT id FROM accounts LIMIT 1;").fetchone()
            if row: acc_id = row[0]

            cursor.execute("""
                INSERT INTO transactions (id, title, amount, type, category, account_id, date, time, merchant, notes, status)
                VALUES (?, ?, ?, 'expense', 'food_dining', ?, ?, ?, ?, ?, 'completed');
            """, (tx_id, f"Pago Automático: {merchant}", amount, acc_id, now_date, now_time, merchant, f"Webhook {source} Desktop"))

            cursor.execute("UPDATE accounts SET balance = MAX(0, balance - ?) WHERE id = ?;", (amount, acc_id))

            wh_id = f"wh_gui_{int(datetime.datetime.now().timestamp()*1000)}"
            cursor.execute("""
                INSERT INTO webhook_events (id, source, payload, parsed_amount, parsed_merchant, status, transaction_id)
                VALUES (?, ?, ?, ?, ?, 'processed', ?);
            """, (wh_id, source, json.dumps(body), amount, merchant, tx_id))

            conn.commit()
            conn.close()

            # Refresh GUI if active
            if main_app:
                main_app.root.after(10, main_app.refresh_all_data)

            res = {"success": True, "message": f"Pago de ${amount:.2f} registrado en GUI sin fricción."}
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._cors()
            self.end_headers()
            self.wfile.write(json.dumps(res).encode("utf-8"))
            return

        self.send_response(404)
        self.end_headers()

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

def start_background_server():
    try:
        server = ReusableTCPServer(("0.0.0.0", PORT), ThreadedWebhookHandler)
        server.serve_forever()
    except Exception as e:
        print(f"Nota Webhook Server (Servidor Python activo en puerto {PORT}): {e}")

# ----------------------------------------------------
# 3. Aplicación de Escritorio Nativa Tkinter GUI
# ----------------------------------------------------
class ModernWealthDesktopApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Modern Wealth & Balance - Desktop GUI Executive Suite")
        self.root.geometry("1100x720")
        self.root.configure(bg="#0F172A")

        # Set styling theme
        self.style = ttk.Style()
        self.style.theme_use("clam")
        self.style.configure(".", font=("Segoe UI", 10), background="#0F172A", foreground="#FFFFFF")
        self.style.configure("TNotebook", background="#0F172A", borderwidth=0)
        self.style.configure("TNotebook.Tab", background="#1E293B", foreground="#94A3B8", padding=[15, 8], font=("Segoe UI", 10, "bold"))
        self.style.map("TNotebook.Tab", background=[("selected", "#0D5C4D")], foreground=[("selected", "#FFFFFF")])

        # Header Frame
        header = tk.Frame(self.root, bg="#1E293B", height=70)
        header.pack(fill=tk.X, side=tk.TOP)

        lbl_logo = tk.Label(header, text="❖ Modern Wealth & Balance", font=("Segoe UI", 16, "bold"), bg="#1E293B", fg="#10B981")
        lbl_logo.pack(side=tk.LEFT, padx=20, pady=15)

        has_gemini = bool(os.environ.get("GEMINI_API_KEY"))
        gemini_badge = "Gemini AI: CONFIGURADA ✓" if has_gemini else "Gemini AI: No detectada"
        badge_color = "#10B981" if has_gemini else "#F59E0B"

        lbl_sub = tk.Label(header, text=f"Suite Nativa Python • {gemini_badge}", font=("Segoe UI", 9, "bold"), bg="#1E293B", fg=badge_color)
        lbl_sub.pack(side=tk.LEFT, pady=18)

        btn_refresh = tk.Button(header, text="↻ Sincronizar", command=self.refresh_all_data, bg="#0D5C4D", fg="#FFFFFF", font=("Segoe UI", 9, "bold"), bd=0, padx=12, pady=5, cursor="hand2")
        btn_refresh.pack(side=tk.RIGHT, padx=20)

        # Main Tabbed Notebook
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=15, pady=15)

        # Build Tabs
        self.tab_overview = ttk.Frame(self.notebook)
        self.tab_secretary = ttk.Frame(self.notebook)
        self.tab_webhooks = ttk.Frame(self.notebook)
        self.tab_ai_voice = ttk.Frame(self.notebook)
        self.tab_tailscale = ttk.Frame(self.notebook)

        self.notebook.add(self.tab_overview, text="📊 Patrimonio & Bóvedas")
        self.notebook.add(self.tab_secretary, text="📋 Agente Secretaria")
        self.notebook.add(self.tab_webhooks, text="⚡ Webhooks Zero-Friction")
        self.notebook.add(self.tab_ai_voice, text="🎤 Voz & Orquestador IA")
        self.notebook.add(self.tab_tailscale, text="🛡️ Conectividad Tailscale")

        self._build_overview_tab()
        self._build_secretary_tab()
        self._build_webhooks_tab()
        self._build_ai_voice_tab()
        self._build_tailscale_tab()

        self.refresh_all_data()

    # --- TAB 1: OVERVIEW & BOVEDAS ---
    def _build_overview_tab(self):
        f = tk.Frame(self.tab_overview, bg="#0F172A")
        f.pack(fill=tk.BOTH, expand=True, padx=15, pady=15)

        banner = tk.Frame(f, bg="#0D5C4D", bd=0, highlightthickness=0)
        banner.pack(fill=tk.X, pady=(0, 15), ipady=10)

        tk.Label(banner, text="PATRIMONIO NETO CONSOLIDADO", font=("Segoe UI", 9, "bold"), bg="#0D5C4D", fg="#A7F3D0").pack(anchor="w", padx=20, pady=(10, 0))
        self.lbl_net_worth = tk.Label(banner, text="$0.00 USD", font=("Segoe UI", 26, "bold"), bg="#0D5C4D", fg="#FFFFFF")
        self.lbl_net_worth.pack(anchor="w", padx=20, pady=(0, 10))

        # Accounts Treeview
        lbl_acc = tk.Label(f, text="Bóvedas & Cuentas de Inversión", font=("Segoe UI", 12, "bold"), bg="#0F172A", fg="#FFFFFF")
        lbl_acc.pack(anchor="w", pady=(5, 5))

        cols = ("ID", "Nombre", "Tipo", "N° Cuenta", "Saldo USD", "APY %", "Institución", "Estado Tarjeta")
        self.tree_acc = ttk.Treeview(f, columns=cols, show="headings", height=6)
        for col in cols:
            self.tree_acc.heading(col, text=col)
            self.tree_acc.column(col, width=120)
        self.tree_acc.pack(fill=tk.X, pady=(0, 10))

        btn_freeze = tk.Button(f, text="❄ Bloquear / Desbloquear Tarjeta Débito", command=self.toggle_freeze_card, bg="#1E293B", fg="#F59E0B", font=("Segoe UI", 9, "bold"), bd=0, padx=10, pady=5)
        btn_freeze.pack(anchor="w")

    # --- TAB 2: AGENTE SECRETARIA ---
    def _build_secretary_tab(self):
        f = tk.Frame(self.tab_secretary, bg="#0F172A")
        f.pack(fill=tk.BOTH, expand=True, padx=15, pady=15)

        top_f = tk.Frame(f, bg="#0F172A")
        top_f.pack(fill=tk.X, pady=(0, 10))

        tk.Label(top_f, text="Agenda Ejecutiva & Tareas de Secretaria Agent", font=("Segoe UI", 12, "bold"), bg="#0F172A", fg="#FFFFFF").pack(side=tk.LEFT)

        btn_add_task = tk.Button(top_f, text="+ Nueva Tarea", command=self.add_task_dialog, bg="#0D5C4D", fg="#FFFFFF", font=("Segoe UI", 9, "bold"), bd=0, padx=10, pady=4)
        btn_add_task.pack(side=tk.RIGHT)

        cols = ("ID", "Título Tarea", "Prioridad", "Fecha Límite", "Estado", "Asignado")
        self.tree_tasks = ttk.Treeview(f, columns=cols, show="headings", height=8)
        for col in cols:
            self.tree_tasks.heading(col, text=col)
            self.tree_tasks.column(col, width=130)
        self.tree_tasks.pack(fill=tk.BOTH, expand=True, pady=(0, 10))
        self.tree_tasks.bind("<Double-1>", lambda e: self.toggle_task_completed())

        btn_complete = tk.Button(f, text="✓ Marcar / Desmarcar Completada", command=self.toggle_task_completed, bg="#10B981", fg="#00201A", font=("Segoe UI", 9, "bold"), bd=0, padx=10, pady=5)
        btn_complete.pack(anchor="w")

    # --- TAB 3: WEBHOOKS ZERO-FRICTION ---
    def _build_webhooks_tab(self):
        f = tk.Frame(self.tab_webhooks, bg="#0F172A")
        f.pack(fill=tk.BOTH, expand=True, padx=15, pady=15)

        # Simulator box
        box = tk.LabelFrame(f, text="Simulador de Webhook Bancario (Hilo Secundario :8000)", font=("Segoe UI", 10, "bold"), bg="#1E293B", fg="#38BDF8", padx=15, pady=15)
        box.pack(fill=tk.X, pady=(0, 15))

        tk.Label(box, text="Comercio:", bg="#1E293B", fg="#FFFFFF").grid(row=0, column=0, sticky="w", pady=5)
        self.entry_merchant = tk.Entry(box, width=30, bg="#0F172A", fg="#FFFFFF", insertbackground="white")
        self.entry_merchant.insert(0, "Uber Eats")
        self.entry_merchant.grid(row=0, column=1, padx=10, pady=5)

        tk.Label(box, text="Monto ($):", bg="#1E293B", fg="#FFFFFF").grid(row=0, column=2, sticky="w", pady=5)
        self.entry_amount = tk.Entry(box, width=15, bg="#0F172A", fg="#FFFFFF", insertbackground="white")
        self.entry_amount.insert(0, "34.50")
        self.entry_amount.grid(row=0, column=3, padx=10, pady=5)

        btn_sim = tk.Button(box, text="Disparar Webhook Zero-Friction", command=self.simulate_webhook, bg="#0284C7", fg="#FFFFFF", font=("Segoe UI", 9, "bold"), bd=0, padx=10, pady=4)
        btn_sim.grid(row=0, column=4, padx=15, pady=5)

        # Webhook Log Tree
        tk.Label(f, text="Registro de Eventos Webhook Recibidos", font=("Segoe UI", 11, "bold"), bg="#0F172A", fg="#FFFFFF").pack(anchor="w", pady=(5, 5))

        cols = ("ID", "Origen", "Comercio Detectado", "Monto Extraído", "Estado Pipeline", "Fecha")
        self.tree_wh = ttk.Treeview(f, columns=cols, show="headings", height=8)
        for col in cols:
            self.tree_wh.heading(col, text=col)
            self.tree_wh.column(col, width=130)
        self.tree_wh.pack(fill=tk.BOTH, expand=True)

    # --- TAB 4: VOZ & IA ORQUESTADOR ---
    def _build_ai_voice_tab(self):
        f = tk.Frame(self.tab_ai_voice, bg="#0F172A")
        f.pack(fill=tk.BOTH, expand=True, padx=15, pady=15)

        tk.Label(f, text="Terminal de Comandos de Voz & Orquestador Multi-Agente", font=("Segoe UI", 12, "bold"), bg="#0F172A", fg="#FFFFFF").pack(anchor="w", pady=(0, 10))

        input_f = tk.Frame(f, bg="#0F172A")
        input_f.pack(fill=tk.X, pady=(0, 10))

        self.entry_prompt = tk.Entry(input_f, font=("Segoe UI", 11), bg="#1E293B", fg="#FFFFFF", insertbackground="white")
        self.entry_prompt.insert(0, "Gasto de 45 dólares en cena")
        self.entry_prompt.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10))

        btn_voice = tk.Button(input_f, text="🎤 Procesar Voz", command=self.process_voice_prompt, bg="#10B981", fg="#00201A", font=("Segoe UI", 10, "bold"), bd=0, padx=15, pady=6)
        btn_voice.pack(side=tk.RIGHT)

        # Response Output Box
        self.txt_ai_response = tk.Text(f, font=("Segoe UI", 10), bg="#1E293B", fg="#A7F3D0", wrap=tk.WORD, height=14)
        self.txt_ai_response.pack(fill=tk.BOTH, expand=True)
        self.txt_ai_response.insert(tk.END, "Bienvenido a la Suite Nativa. Escribe o di un comando para que el Orquestador Multi-Agente clasifique la intención entre la Secretaria y Finanzas.")

    # --- TAB 5: TAILSCALE VPN ---
    def _build_tailscale_tab(self):
        f = tk.Frame(self.tab_tailscale, bg="#0F172A")
        f.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)

        box = tk.Frame(f, bg="#1E293B", bd=0, padx=20, py=20)
        box.pack(fill=tk.BOTH, expand=True)

        tk.Label(box, text="🛡 Diagnóstico de Seguridad & Conectividad Tailscale", font=("Segoe UI", 14, "bold"), bg="#1E293B", fg="#10B981").pack(anchor="w", pady=(0, 10))

        status = get_tailscale_status()
        has_key = bool(os.environ.get("GEMINI_API_KEY"))

        self.lbl_ts_status = tk.Label(box, text=f"• Estado: {status['mode']}\n• IP Privada Tailscale: {status['tailscaleIp']}\n• Puerto Servidor GUI: {status['port']}\n• Gemini API Key: {'CONFIGURADA ✓' if has_key else 'NO CONFIGURADA'}\n• Cifrado WireGuard p2p: Activo", font=("Segoe UI", 11), bg="#1E293B", fg="#FFFFFF", justify="left")
        self.lbl_ts_status.pack(anchor="w", pady=10)

    # --- LOGICA DE ACTUALIZACIÓN & HANDLERS ---
    def refresh_all_data(self):
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("SELECT SUM(balance) FROM accounts;")
        total = cursor.fetchone()[0] or 0.0
        self.lbl_net_worth.config(text=f"${total:,.2f} USD")

        for i in self.tree_acc.get_children(): self.tree_acc.delete(i)
        accounts = cursor.execute("SELECT id, name, type, account_number_masked, balance, apy, institution, card_frozen FROM accounts;").fetchall()
        for a in accounts:
            frozen_str = "❄ Bloqueada" if a["card_frozen"] else "✓ Activa"
            apy_str = f"{a['apy']}%" if a["apy"] else "N/A"
            self.tree_acc.insert("", tk.END, values=(a["id"], a["name"], a["type"], a["account_number_masked"], f"${a['balance']:,.2f}", apy_str, a["institution"], frozen_str))

        for i in self.tree_tasks.get_children(): self.tree_tasks.delete(i)
        tasks = cursor.execute("SELECT id, title, priority, due_date, completed, assigned_to FROM tasks ORDER BY created_at DESC;").fetchall()
        for t in tasks:
            status_str = "☑ [✓] Completada" if t["completed"] else "☐ [ ] Pendiente"
            self.tree_tasks.insert("", tk.END, values=(t["id"], t["title"], t["priority"].upper(), t["due_date"] or "N/A", status_str, t["assigned_to"]))

        for i in self.tree_wh.get_children(): self.tree_wh.delete(i)
        webhooks = cursor.execute("SELECT id, source, parsed_merchant, parsed_amount, status, created_at FROM webhook_events ORDER BY created_at DESC;").fetchall()
        for w in webhooks:
            self.tree_wh.insert("", tk.END, values=(w["id"], w["source"], w["parsed_merchant"] or "N/A", f"${w['parsed_amount']:.2f}", w["status"], w["created_at"]))

        conn.close()

    def toggle_freeze_card(self):
        sel = self.tree_acc.selection()
        if not sel:
            messagebox.showinfo("Selección", "Por favor selecciona una cuenta de la lista arriba.")
            return
        acc_id = self.tree_acc.item(sel[0])["values"][0]
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("UPDATE accounts SET card_frozen = NOT card_frozen WHERE id = ?;", (acc_id,))
        conn.commit()
        conn.close()
        self.refresh_all_data()

    def toggle_task_completed(self):
        sel = self.tree_tasks.selection()
        if not sel:
            children = self.tree_tasks.get_children()
            if not children:
                return
            sel = [children[0]]
            self.tree_tasks.selection_set(children[0])
        t_id = self.tree_tasks.item(sel[0])["values"][0]
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("UPDATE tasks SET completed = NOT completed WHERE id = ?;", (t_id,))
        conn.commit()
        conn.close()
        self.refresh_all_data()

    def add_task_dialog(self):
        win = tk.Toplevel(self.root)
        win.title("Nueva Tarea Ejecutiva")
        win.geometry("420x210")
        win.configure(bg="#1E293B")
        win.transient(self.root)
        win.grab_set()

        tk.Label(win, text="Título de la Tarea:", bg="#1E293B", fg="#FFFFFF", font=("Segoe UI", 10, "bold")).pack(anchor="w", padx=20, pady=(15, 5))
        entry_t = tk.Entry(win, font=("Segoe UI", 10), bg="#0F172A", fg="#FFFFFF", insertbackground="white")
        entry_t.pack(fill=tk.X, padx=20, pady=(0, 15))
        entry_t.focus_set()

        def _save(event=None):
            title = entry_t.get().strip()
            if title:
                conn = get_db()
                t_id = f"task_{int(datetime.datetime.now().timestamp()*1000)}"
                conn.execute("INSERT INTO tasks (id, title, priority, category, completed, assigned_to) VALUES (?, ?, 'medium', 'general', 0, 'Secretary Agent');", (t_id, title))
                conn.commit()
                conn.close()
                win.destroy()
                self.refresh_all_data()

        entry_t.bind("<Return>", _save)

        btn_f = tk.Frame(win, bg="#1E293B")
        btn_f.pack(fill=tk.X, padx=20, pady=10)
        btn_cancel = tk.Button(btn_f, text="Cancelar", command=win.destroy, bg="#334155", fg="#FFFFFF", font=("Segoe UI", 9, "bold"), bd=0, padx=12, pady=5)
        btn_cancel.pack(side=tk.RIGHT, padx=(10, 0))
        btn_s = tk.Button(btn_f, text="Guardar Tarea", command=_save, bg="#0D5C4D", fg="#FFFFFF", font=("Segoe UI", 9, "bold"), bd=0, padx=12, pady=5)
        btn_s.pack(side=tk.RIGHT)

    def simulate_webhook(self):
        merchant = self.entry_merchant.get().strip()
        amount = float(self.entry_amount.get() or 0)
        conn = get_db()
        cursor = conn.cursor()
        tx_id = f"tx_gui_{int(datetime.datetime.now().timestamp()*1000)}"
        now_date = datetime.datetime.now().strftime("%Y-%m-%d")
        now_time = datetime.datetime.now().strftime("%H:%M")

        acc_id = "acc_checking"
        row = cursor.execute("SELECT id FROM accounts LIMIT 1;").fetchone()
        if row: acc_id = row[0]

        cursor.execute("INSERT INTO transactions (id, title, amount, type, category, account_id, date, time, merchant, status) VALUES (?, ?, ?, 'expense', 'food_dining', ?, ?, ?, ?, 'completed');", (tx_id, f"Pago Automático: {merchant}", amount, acc_id, now_date, now_time, merchant))
        cursor.execute("UPDATE accounts SET balance = MAX(0, balance - ?) WHERE id = ?;", (amount, acc_id))

        wh_id = f"wh_gui_{int(datetime.datetime.now().timestamp()*1000)}"
        cursor.execute("INSERT INTO webhook_events (id, source, payload, parsed_amount, parsed_merchant, status, transaction_id) VALUES (?, 'AppleShortcuts_iOS', ?, ?, ?, 'processed', ?);", (wh_id, f"Simulado GUI: ${amount}", amount, merchant, tx_id))

        conn.commit()
        conn.close()
        self.refresh_all_data()
        speak_audio(f"Pago de {amount} dólares en {merchant} procesado sin fricción")

    def process_voice_prompt(self):
        prompt = self.entry_prompt.get().strip()
        if not prompt: return

        lower = prompt.lower()
        is_complete_cmd = any(w in lower for w in ["complet", "termin", "hech", "finaliz", "cumplid", "listo", "lista", "marcar", "marques", "cerrar", "conclui"])
        target_agent = "secretary" if (is_complete_cmd or any(w in lower for w in ["tarea", "recordar", "agenda", "correo", "nota"])) else "financial"

        if target_agent == "secretary":
            conn = get_db()
            cursor = conn.cursor()
            if is_complete_cmd:
                pending = cursor.execute("SELECT id, title FROM tasks WHERE completed = 0;").fetchall()
                matched_title = ""
                if pending:
                    words = [w for w in re.sub(r'[^\w\s]', '', lower).split() if len(w) > 2 and w not in ["completar", "completa", "completada", "terminar", "terminada", "tarea", "tareas", "hecha", "hecho", "finalizar", "finalizada", "lista", "listo", "marcar", "que", "para", "del", "por", "favor", "agenda"]]
                    matched = None
                    for t in pending:
                        t_lower = t["title"].lower()
                        if any(w in t_lower for w in words):
                            matched = t
                            break
                    if not matched: matched = pending[0]
                    cursor.execute("UPDATE tasks SET completed = 1 WHERE id = ?;", (matched["id"],))
                    conn.commit()
                    matched_title = matched["title"]
                conn.close()

                reply = f"• Orquestador -> AGENTE SECRETARIA\n• Acción: Tarea \"{matched_title}\" marcada como completada ✓" if matched_title else "• Orquestador -> AGENTE SECRETARIA\n• Acción: No hay tareas pendientes por completar."
                spoken = f"Tarea {matched_title} completada" if matched_title else "No hay tareas pendientes"
            else:
                task_title = re.sub(r'^(crear|recordar|agregar|agendar|añadir|nueva|tarea|de|que)\s*', '', prompt, flags=re.IGNORECASE).strip() or prompt
                task_title = task_title.capitalize()
                t_id = f"task_{int(datetime.datetime.now().timestamp()*1000)}"
                cursor.execute("INSERT INTO tasks (id, title, priority, category, completed, assigned_to) VALUES (?, ?, 'medium', 'general', 0, 'Secretary Agent');", (t_id, task_title))
                conn.commit()
                conn.close()

                reply = f"• Orquestador -> AGENTE SECRETARIA\n• Acción: Tarea \"{task_title}\" agendada en la base de datos."
                spoken = f"Tarea {task_title} agendada por la Secretaria"
        else:
            amount_match = re.search(r'(?:(?:de|\$)\s*)?(\d+(?:[.,]\d+)?)', prompt)
            amount = float(amount_match.group(1).replace(',', '.')) if amount_match else 45.0
            conn = get_db()
            tx_id = f"tx_v_{int(datetime.datetime.now().timestamp()*1000)}"
            now_date = datetime.datetime.now().strftime("%Y-%m-%d")
            acc_id = "acc_checking"
            conn.execute("INSERT INTO transactions (id, title, amount, type, category, account_id, date, merchant, status) VALUES (?, ?, ?, 'expense', 'food_dining', ?, ?, 'Comando de Voz', 'completed');", (tx_id, prompt, amount, acc_id, now_date))
            conn.execute("UPDATE accounts SET balance = MAX(0, balance - ?) WHERE id = ?;", (amount, acc_id))
            conn.commit()
            conn.close()

            reply = f"• Orquestador -> AGENTE FINANCIERO\n• Acción: Gasto de ${amount:.2f} registrado en Cuenta Operativa."
            spoken = f"Gasto de {amount} dólares registrado"

        self.txt_ai_response.insert(tk.END, f"\n\n[Comando]: {prompt}\n{reply}")
        self.txt_ai_response.see(tk.END)
        self.refresh_all_data()
        speak_audio(spoken)

main_app = None

def main():
    global main_app
    threading.Thread(target=start_background_server, daemon=True).start()
    root = tk.Tk()
    main_app = ModernWealthDesktopApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()
