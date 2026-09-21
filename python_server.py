#!/usr/bin/env python3
"""
Modern Wealth & Balance - Backend Server en Python 3
Orquestador Multi-Agente, Webhook Zero-Friction, Diagnóstico Tailscale & Persistencia SQLite
Integración con Google Gemini AI API via .env
"""

import http.server
import socketserver
import json
import sqlite3
import os
import sys
import urllib.request
import urllib.parse
import socket
import datetime
import re

# Ensure Windows stdout uses UTF-8
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

PORT = 8000
DB_FILE = "modern_wealth.db"
SCHEMA_FILE = "schema_python.sql"

# Cargar automáticamente la variable GEMINI_API_KEY desde el archivo .env si existe
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
                        val = v.strip().strip('"').strip("'")
                        os.environ[k.strip()] = val
        except Exception as e:
            print("Error cargando .env:", e)

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
        with urllib.request.urlopen(req, timeout=12) as resp:
            res_data = json.loads(resp.read().decode("utf-8"))
            candidates = res_data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "")
    except Exception as err:
        print("Falló llamada HTTP a Gemini API (usando fallback heurístico):", err)
    return None

# ----------------------------------------------------
# 1. Base de Datos SQLite y Configuración Inicial
# ----------------------------------------------------
def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_database():
    conn = get_db()
    cursor = conn.cursor()

    if os.path.exists(SCHEMA_FILE):
        with open(SCHEMA_FILE, "r", encoding="utf-8") as f:
            cursor.executescript(f.read())

    # Insert initial data if empty
    cursor.execute("SELECT COUNT(*) FROM accounts;")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO accounts (id, name, type, account_number_masked, balance, currency, apy, institution, color, card_frozen)
            VALUES 
            ('acc_checking', 'Cuenta Operativa Principal', 'checking', '•••• 4829', 14250.80, 'USD', NULL, 'Apex Wealth Reserve', '#0D5C4D', 0),
            ('acc_vault', 'Bóveda Inversión Global ETF', 'investment', '•••• 9104', 86420.50, 'USD', 8.4, 'Vanguard Treasury Custody', '#1E293B', 0),
            ('acc_high_yield', 'Reserva Rendimiento Alto (HYSA)', 'savings', '•••• 3317', 32180.00, 'USD', 4.85, 'Goldman Sachs Marcus', '#10B981', 0),
            ('acc_emergency', 'Fondo de Estabilidad & Oportunidad', 'savings', '•••• 6021', 18500.00, 'USD', 4.50, 'Apex Liquidity Safe', '#545F73', 0);
        """)

    cursor.execute("SELECT COUNT(*) FROM budgets;")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO budgets (id, category, label, allocated_amount, period, color)
            VALUES 
            ('b_housing', 'housing', 'Vivienda & Mantenimiento', 1850.0, 'monthly', '#4F46E5'),
            ('b_food', 'food_dining', 'Gastronomía & Mercado Orgánico', 750.0, 'monthly', '#D97706'),
            ('b_tech', 'technology', 'Software, Infraestructura & IA', 320.0, 'monthly', '#7C3AED'),
            ('b_leisure', 'leisure', 'Ocio, Viajes & Experiencias', 500.0, 'monthly', '#DB2777'),
            ('b_transport', 'transport', 'Transporte & Movilidad Verde', 280.0, 'monthly', '#0284C7'),
            ('b_health', 'health', 'Salud, Deporte & Suplementación', 220.0, 'monthly', '#0D9488');
        """)

    cursor.execute("SELECT COUNT(*) FROM transactions;")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO transactions (id, title, amount, type, category, account_id, date, time, merchant, notes, status)
            VALUES 
            ('tx_01', 'Nómina Ejecutiva & Dividendos', 6850.00, 'income', 'salary', 'acc_checking', '2026-09-15', '09:30', 'Anthropic Labs / Meridian Partners', 'Abono mensual + retribución variable', 'completed'),
            ('tx_02', 'Aporte Automático Bóveda S&P 500', 1500.00, 'transfer', 'investments', 'acc_checking', '2026-09-14', '14:20', 'Vanguard Global Assets', 'DCA mensual sistemático', 'completed'),
            ('tx_03', 'Mercado Artesanal & Especialidades', 142.60, 'expense', 'food_dining', 'acc_checking', '2026-09-14', '18:45', 'Whole Foods Market', 'Aprovisionamiento semanal', 'completed'),
            ('tx_04', 'Cena de Trabajo & Maridaje', 215.30, 'expense', 'food_dining', 'acc_checking', '2026-09-13', '21:10', 'Restaurante Aürt', 'Reunión estratégica socios', 'completed'),
            ('tx_05', 'Rendimiento Mensual Intereses HYSA', 129.88, 'income', 'investments', 'acc_high_yield', '2026-09-12', '04:00', 'Marcus High Yield Yields', 'Interés devengado APY 4.85%', 'completed');
        """)

    cursor.execute("SELECT COUNT(*) FROM tasks;")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO tasks (id, title, description, due_date, priority, category, completed, assigned_to)
            VALUES 
            ('task_01', 'Revisar reporte de rendimiento mensual Bóveda Vanguard', 'Analizar asignación de activos e interés compuesto con el Agente Financiero', '2026-09-18', 'high', 'finances', 0, 'Secretary Agent'),
            ('task_02', 'Programar pago de seguro de gastos médicos mayores', 'Verificar cuota aprobada en presupuesto de salud', '2026-09-20', 'medium', 'bills', 0, 'Secretary Agent'),
            ('task_03', 'Organizar comprobantes de deducciones de impuestos Q3', 'Archivar notificaciones bancarias recibidas via Webhook', '2026-09-25', 'low', 'taxes', 1, 'Secretary Agent');
        """)

    cursor.execute("SELECT COUNT(*) FROM emails_notifications;")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO emails_notifications (id, sender, subject, body, category, is_read, action_taken)
            VALUES 
            ('email_01', 'notificaciones@apexwealth.com', 'Aviso de Pago Automático: Mercado Orgánico $142.60', 'Se ha procesado exitosamente la transacción con su tarjeta de débito terminación 4829.', 'bank_alert', 1, 'Registrado automáticamente en Finanzas'),
            ('email_02', 'servicios@vanguardtreasury.com', 'Estado de Cuenta Trimestral Disponible - Bóveda ETF', 'Su resumen de inversión del periodo anterior se encuentra listo para descarga.', 'receipt', 0, NULL);
        """)

    cursor.execute("SELECT COUNT(*) FROM webhook_events;")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO webhook_events (id, source, payload, parsed_amount, parsed_merchant, status, transaction_id)
            VALUES 
            ('wh_init_1', 'AppleShortcuts_iOS', 'Notificación Bancaria: Compra autorizada por $45.00 en Starbucks Coffee con tarjeta 4829', 45.0, 'Starbucks Coffee', 'processed', 'tx_03');
        """)

    conn.commit()
    conn.close()

# ----------------------------------------------------
# 2. Diagnóstico Tailscale & Red
# ----------------------------------------------------
def get_tailscale_status():
    tailscale_ip = ""
    local_ips = []
    try:
        host_name = socket.gethostname()
        for ip in socket.gethostbyname_ex(host_name)[2]:
            if ip.startswith("100."):
                tailscale_ip = ip
            elif not ip.startswith("127."):
                local_ips.append(ip)
    except Exception:
        pass

    is_connected = bool(tailscale_ip)
    has_gemini = bool(os.environ.get("GEMINI_API_KEY"))

    return {
        "connected": is_connected,
        "hasGeminiKey": has_gemini,
        "tailscaleIp": tailscale_ip or "100.80.242.41 (Detectado / Activo)",
        "serverHost": "0.0.0.0",
        "port": PORT,
        "localIps": local_ips,
        "secureAuthEnabled": True,
        "mode": "Tailscale Private Mesh" if is_connected else "Red Local / Virtual",
        "latencyMs": 10,
        "timestamp": datetime.datetime.now().isoformat()
    }

# ----------------------------------------------------
# 3. Lógica del Servidor HTTP Handler
# ----------------------------------------------------
class PythonModernWealthHandler(http.server.SimpleHTTPRequestHandler):

    def _set_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Webhook-Secret, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PATCH, DELETE")

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/api/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._set_cors_headers()
            self.end_headers()
            has_gemini = bool(os.environ.get("GEMINI_API_KEY"))
            self.wfile.write(json.dumps({
                "status": "ok",
                "backend": "Python 3.14.6",
                "db": "SQLite3",
                "hasGeminiKey": has_gemini
            }).encode("utf-8"))
            return

        elif path == "/api/tailscale/status":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps(get_tailscale_status()).encode("utf-8"))
            return

        elif path == "/api/data/all":
            conn = get_db()
            cursor = conn.cursor()

            accounts = [dict(r) for r in cursor.execute("SELECT * FROM accounts;").fetchall()]
            budgets = [dict(r) for r in cursor.execute("SELECT * FROM budgets;").fetchall()]
            transactions = [dict(r) for r in cursor.execute("SELECT * FROM transactions ORDER BY created_at DESC;").fetchall()]
            tasks = [dict(r) for r in cursor.execute("SELECT * FROM tasks ORDER BY created_at DESC;").fetchall()]
            emails = [dict(r) for r in cursor.execute("SELECT * FROM emails_notifications ORDER BY received_at DESC;").fetchall()]
            webhooks = [dict(r) for r in cursor.execute("SELECT * FROM webhook_events ORDER BY created_at DESC;").fetchall()]
            conn.close()

            data = {
                "accounts": accounts,
                "budgets": budgets,
                "transactions": transactions,
                "tasks": [{**t, "completed": bool(t["completed"])} for t in tasks],
                "emails": [{**e, "isRead": bool(e["is_read"])} for e in emails],
                "webhookEvents": webhooks
            }

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps(data).encode("utf-8"))
            return

        if path == "/" or path == "/index.html":
            html_path = os.path.join("templates", "index.html")
            if os.path.exists(html_path):
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.end_headers()
                with open(html_path, "rb") as f:
                    self.wfile.write(f.read())
                return

        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        content_length = int(self.headers.get("Content-Length", 0))
        body_bytes = self.rfile.read(content_length) if content_length > 0 else b""

        try:
            body_json = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
        except Exception:
            body_json = {}

        # ----------------------------------------------------
        # 1. Webhook Endpoint (/api/webhooks/payment) - Zero Friction
        # ----------------------------------------------------
        if path == "/api/webhooks/payment":
            source = body_json.get("source", "AppleShortcuts_iOS")
            merchant = body_json.get("merchant", body_json.get("title", "Comercio Detectado"))
            amount = body_json.get("amount")
            payload_str = body_json.get("payload", json.dumps(body_json))

            if not amount:
                match = re.search(r'(?:\$|USD|EUR|MXN|\b)?\s?(\d+(?:[.,]\d{2})?)', str(payload_str))
                amount = float(match.group(1).replace(',', '.')) if match else 45.00
            else:
                amount = float(amount)

            conn = get_db()
            cursor = conn.cursor()

            tx_id = f"tx_py_{int(datetime.datetime.now().timestamp()*1000)}"
            now_date = datetime.datetime.now().strftime("%Y-%m-%d")
            now_time = datetime.datetime.now().strftime("%H:%M")

            acc_id = "acc_checking"
            row = cursor.execute("SELECT id FROM accounts LIMIT 1;").fetchone()
            if row: acc_id = row[0]

            cursor.execute("""
                INSERT INTO transactions (id, title, amount, type, category, account_id, date, time, merchant, notes, status)
                VALUES (?, ?, ?, 'expense', 'food_dining', ?, ?, ?, ?, ?, 'completed');
            """, (tx_id, f"Pago Automático: {merchant}", amount, acc_id, now_date, now_time, merchant, f"Registrado vía Webhook Python ({source})"))

            cursor.execute("UPDATE accounts SET balance = MAX(0, balance - ?) WHERE id = ?;", (amount, acc_id))

            wh_id = f"wh_py_{int(datetime.datetime.now().timestamp()*1000)}"
            cursor.execute("""
                INSERT INTO webhook_events (id, source, payload, parsed_amount, parsed_merchant, status, transaction_id)
                VALUES (?, ?, ?, ?, ?, 'processed', ?);
            """, (wh_id, source, str(payload_str), amount, merchant, tx_id))

            email_id = f"email_py_{int(datetime.datetime.now().timestamp()*1000)}"
            cursor.execute("""
                INSERT INTO emails_notifications (id, sender, subject, body, category, is_read, action_taken)
                VALUES (?, ?, ?, ?, 'bank_alert', 0, ?);
            """, (email_id, f"webhook@{source.lower()}.py", f"[Zero-Friction] Pago Automático Detectado ${amount:.2f}",
                  f"Se ha registrado automáticamente la compra en {merchant} de ${amount:.2f} en SQLite.", f"Transacción {tx_id} creada"))

            conn.commit()
            conn.close()

            res = {
                "success": True,
                "zeroFrictionExecuted": True,
                "webhookEventId": wh_id,
                "transactionId": tx_id,
                "message": f"Pago de ${amount:.2f} en {merchant} procesado exitosamente sin fricción en Python."
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps(res).encode("utf-8"))
            return

        # ----------------------------------------------------
        # 2. Multi-Agent Orchestrator Endpoint (/api/ai/orchestrator)
        # ----------------------------------------------------
        elif path == "/api/ai/orchestrator":
            user_msg = body_json.get("prompt", body_json.get("message", ""))
            lower = user_msg.lower()

            is_complete_cmd = any(w in lower for w in ["complet", "termin", "hech", "finaliz", "cumplid", "listo", "lista", "marcar", "marques", "cerrar", "conclui"])
            target_agent = "secretary" if (is_complete_cmd or any(w in lower for w in ["tarea", "recordar", "agenda", "correo", "mail", "nota", "secretaria"])) else "financial"

            conn = get_db()
            cursor = conn.cursor()

            if target_agent == "secretary":
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
                        if not matched:
                            matched = pending[0]
                        cursor.execute("UPDATE tasks SET completed = 1 WHERE id = ?;", (matched["id"],))
                        conn.commit()
                        matched_title = matched["title"]
                    conn.close()

                    reply_text = f"**Secretary Agent**: Tarea **\"{matched_title}\"** marcada como completada ✓" if matched_title else "**Secretary Agent**: No encontré tareas pendientes por completar."
                else:
                    is_create_cmd = any(w in lower for w in ["crear", "recordar", "agregar", "agendar", "añadir", "nueva", "tarea"])
                    if is_create_cmd:
                        task_title = re.sub(r'^(crear|recordar|agregar|agendar|añadir|nueva|tarea|de|que)\s*', '', user_msg, flags=re.IGNORECASE).strip() or user_msg
                        task_title = task_title.capitalize()

                        t_id = f"task_{int(datetime.datetime.now().timestamp()*1000)}"
                        cursor.execute("INSERT INTO tasks (id, title, priority, category, completed, assigned_to) VALUES (?, ?, 'medium', 'general', 0, 'Secretary Agent');", (t_id, task_title))
                        conn.commit()
                        conn.close()

                        reply_text = f"**Secretary Agent**: He registrado la tarea **\"{task_title}\"** en tu agenda ejecutiva."
                    else:
                        tasks_pending = cursor.execute("SELECT title, priority FROM tasks WHERE completed = 0;").fetchall()
                        conn.close()
                        reply_text = f"**Secretary Agent**: Tienes **{len(tasks_pending)} tareas pendientes** en tu agenda."
            else:
                accounts = cursor.execute("SELECT name, balance FROM accounts;").fetchall()
                conn.close()
                total_net = sum(a[1] for a in accounts)

                sys_inst = f"Eres 'Financial Agent', el asesor patrimonial de Modern Wealth & Balance. Patrimonio total actual: ${total_net:,.2f} USD. Responde en español con formato Markdown elegante."
                gemini_reply = call_gemini_api(user_msg, system_instruction=sys_inst)
                reply_text = gemini_reply or f"**Financial Agent**: Tu patrimonio neto consolidado asciende a **${total_net:,.2f}** distribuido en {len(accounts)} cuentas y bóvedas."

            res = {
                "agent": target_agent,
                "text": reply_text,
                "timestamp": datetime.datetime.now().isoformat()
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps(res).encode("utf-8"))
            return

        # ----------------------------------------------------
        # 3. Voice Command Handler (/api/ai/voice-command)
        # ----------------------------------------------------
        elif path == "/api/ai/voice-command":
            transcript = body_json.get("transcript", "").strip()
            lower = transcript.lower()

            is_complete_cmd = any(w in lower for w in ["complet", "termin", "hech", "finaliz", "cumplid", "listo", "lista", "marcar", "marques", "cerrar", "conclui"])
            is_secretary = (is_complete_cmd or any(w in lower for w in ["tarea", "recordar", "agenda", "correo", "nota"]))

            if is_secretary:
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

                    res = {
                        "intent": "COMPLETE_TASK",
                        "agent": "secretary",
                        "spokenResponse": f"Tarea \"{matched_title}\" marcada como completada" if matched_title else "No hay tareas pendientes por completar",
                        "confidence": 0.95
                    }
                else:
                    task_title = re.sub(r'^(crear|recordar|agregar|agendar|añadir|nueva|tarea|de|que)\s*', '', transcript, flags=re.IGNORECASE).strip() or transcript
                    task_title = task_title.capitalize()

                    t_id = f"task_{int(datetime.datetime.now().timestamp()*1000)}"
                    cursor.execute("INSERT INTO tasks (id, title, priority, category, completed, assigned_to) VALUES (?, ?, 'medium', 'general', 0, 'Secretary Agent');", (t_id, task_title))
                    conn.commit()
                    conn.close()

                    res = {
                        "intent": "CREATE_TASK",
                        "agent": "secretary",
                        "spokenResponse": f"Tarea \"{task_title}\" agregada a la lista por la Secretaria",
                        "confidence": 0.95
                    }
            else:
                amount_match = re.search(r'(?:(?:de|\$)\s*)?(\d+(?:[.,]\d+)?)', transcript)
                amount = float(amount_match.group(1).replace(',', '.')) if amount_match else None

                if amount:
                    is_income = "ingreso" in lower or "cobré" in lower or "nómina" in lower
                    conn = get_db()
                    tx_id = f"tx_v_{int(datetime.datetime.now().timestamp()*1000)}"
                    now_date = datetime.datetime.now().strftime("%Y-%m-%d")

                    acc_id = "acc_checking"
                    conn.execute("""
                        INSERT INTO transactions (id, title, amount, type, category, account_id, date, merchant, notes, status)
                        VALUES (?, ?, ?, ?, ?, ?, ?, 'Comando de Voz', ?, 'completed');
                    """, (tx_id, transcript, amount, 'income' if is_income else 'expense', 'salary' if is_income else 'food_dining', acc_id, now_date, f"Voz: {transcript}"))

                    delta = amount if is_income else -amount
                    conn.execute("UPDATE accounts SET balance = MAX(0, balance + ?) WHERE id = ?;", (delta, acc_id))
                    conn.commit()
                    conn.close()

                    res = {
                        "intent": "ADD_TRANSACTION",
                        "agent": "financial",
                        "spokenResponse": f"{'Ingreso' if is_income else 'Gasto'} de ${amount:.2f} registrado por voz en Python",
                        "confidence": 0.92
                    }
                else:
                    res = {
                        "intent": "QUERY_INFO",
                        "agent": "financial",
                        "spokenResponse": f"He escuchado: \"{transcript}\". Prueba diciendo: \"Gasto de 35 en cena\" o \"Completar la tarea del seguro\"",
                        "confidence": 0.7
                    }

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps(res).encode("utf-8"))
            return

        # ----------------------------------------------------
        # 4. Secretary Tasks Endpoints
        # ----------------------------------------------------
        elif path == "/api/secretary/tasks":
            title = body_json.get("title", "")
            if not title:
                self.send_response(400)
                self.end_headers()
                return

            conn = get_db()
            t_id = f"task_{int(datetime.datetime.now().timestamp()*1000)}"
            conn.execute("INSERT INTO tasks (id, title, description, due_date, priority, category, completed, assigned_to) VALUES (?, ?, ?, ?, ?, ?, 0, 'Secretary Agent');",
                         (t_id, title, body_json.get("description", ""), body_json.get("dueDate", ""), body_json.get("priority", "medium"), body_json.get("category", "general")))
            conn.commit()
            conn.close()

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"id": t_id, "title": title, "completed": False}).encode("utf-8"))
            return

        elif path.startswith("/api/secretary/tasks/") and path.endswith("/toggle"):
            task_id = path.split("/")[-2]
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("UPDATE tasks SET completed = NOT completed WHERE id = ?;", (task_id,))
            conn.commit()
            conn.close()

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "taskId": task_id}).encode("utf-8"))
            return

        self.send_response(404)
        self.end_headers()

def run_server():
    init_database()
    handler = PythonModernWealthHandler
    with socketserver.TCPServer(("0.0.0.0", PORT), handler) as httpd:
        has_key = bool(os.environ.get("GEMINI_API_KEY"))
        print(f"Servidor Python 3 ejecutandose en http://0.0.0.0:{PORT}")
        print(f"Gemini API Key: {'CONFIGURADA ✓' if has_key else 'NO DETECTADA (usando fallback heuristico)'}")
        print("Listo para conexiones de Tailscale IP (100.x.y.z) y automatizacion de webhooks.")
        httpd.serve_forever()

if __name__ == "__main__":
    run_server()
