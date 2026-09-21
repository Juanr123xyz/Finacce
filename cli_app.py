#!/usr/bin/env python3
"""
Modern Wealth & Balance - Terminal Command Center CLI
Aplicación interactiva de terminal para gestión de tesorería, tareas de Secretaria, webhooks e Inteligencia Artificial.
"""

import sqlite3
import os
import sys
import datetime
import json
import urllib.request
import urllib.parse
import re

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

DB_FILE = "modern_wealth.db"

# ANSI Colors for Terminal
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"
MAGENTA = "\033[95m"

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def print_header():
    os.system("cls" if os.name == "nt" else "clear")
    print(f"{CYAN}{BOLD}==============================================================={RESET}")
    print(f"{GREEN}{BOLD}   MODERN WEALTH & BALANCE - TERMINAL COMMAND CENTER CLI{RESET}")
    print(f"{CYAN}{BOLD}==============================================================={RESET}")

    api_key = os.environ.get("GEMINI_API_KEY", "")
    key_status = f"{GREEN}Gemini AI: CONFIGURADA ✓{RESET}" if api_key else f"{YELLOW}Gemini AI: Fallback Heurístico{RESET}"
    print(f" Modos: Multi-Agente • SQLite • Tailscale Ready • {key_status}\n")

def show_overview():
    conn = get_db()
    cursor = conn.cursor()

    total_net = cursor.execute("SELECT SUM(balance) FROM accounts;").fetchone()[0] or 0.0
    accounts = cursor.execute("SELECT name, balance, institution, card_frozen FROM accounts;").fetchall()
    tasks_count = cursor.execute("SELECT COUNT(*) FROM tasks WHERE completed = 0;").fetchone()[0]
    webhooks_count = cursor.execute("SELECT COUNT(*) FROM webhook_events;").fetchone()[0]

    print(f"{BOLD}📊 PATRIMONIO NETO CONSOLIDADO:{RESET} {GREEN}{BOLD}${total_net:,.2f} USD{RESET}")
    print("-" * 63)
    print(f"{BOLD}BÓVEDAS & CUENTAS:{RESET}")
    for a in accounts:
        frozen = f"{RED}[TARJETA BLOQUEADA]{RESET}" if a["card_frozen"] else f"{GREEN}[ACTIVA]{RESET}"
        print(f"  • {a['name']:<35} : ${a['balance']:>12,.2f} USD  {frozen}")

    print("-" * 63)
    print(f"📋 Tareas Pendientes Secretaria : {YELLOW}{tasks_count}{RESET}")
    print(f"⚡ Webhooks Registrados         : {CYAN}{webhooks_count}{RESET}\n")
    conn.close()

def show_transactions():
    conn = get_db()
    cursor = conn.cursor()
    txs = cursor.execute("SELECT date, title, amount, type, category FROM transactions ORDER BY created_at DESC LIMIT 10;").fetchall()
    conn.close()

    print(f"\n{BOLD}📜 ÚLTIMAS 10 TRANSACCIONES:{RESET}")
    print(f"{'FECHA':<12} {'TÍTULO':<35} {'CATEGORÍA':<15} {'MONTO USD':<12}")
    print("-" * 75)
    for t in txs:
        color = GREEN if t["type"] == "income" else RESET
        sign = "+" if t["type"] == "income" else "-"
        print(f"{t['date']:<12} {t['title'][:33]:<35} {t['category']:<15} {color}{sign}${t['amount']:>8.2f}{RESET}")
    print()

def show_tasks():
    conn = get_db()
    cursor = conn.cursor()
    tasks = cursor.execute("SELECT id, title, priority, due_date, completed FROM tasks ORDER BY created_at DESC;").fetchall()
    conn.close()

    print(f"\n{BOLD}📋 AGENDA DE LA SECRETARIA AGENT:{RESET}")
    for t in tasks:
        status = f"{GREEN}[✓]{RESET}" if t["completed"] else f"{YELLOW}[⏳]{RESET}"
        prio_color = RED if t["priority"] == "high" else YELLOW if t["priority"] == "medium" else RESET
        print(f"  {status} [{t['id']}] {t['title']} ({prio_color}{t['priority'].upper()}{RESET}) - Vence: {t['due_date'] or 'N/A'}")
    print()

def process_voice_or_prompt():
    prompt = input(f"{MAGENTA}{BOLD}🎤 Escribe tu comando o consulta para los Agentes: {RESET}").strip()
    if not prompt: return

    lower = prompt.lower()
    is_complete_cmd = any(w in lower for w in ["complet", "termin", "hech", "finaliz", "cumplid", "listo", "lista", "marcar", "marques", "cerrar", "conclui"])
    is_secretary = (is_complete_cmd or any(w in lower for w in ["tarea", "recordar", "agenda", "correo", "nota"]))

    conn = get_db()
    cursor = conn.cursor()

    if is_secretary:
        if is_complete_cmd:
            pending = cursor.execute("SELECT id, title FROM tasks WHERE completed = 0;").fetchall()
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
                print(f"\n{GREEN}✓ [Secretary Agent]: Tarea '{matched['title']}' marcada como completada ✓{RESET}\n")
            else:
                print(f"\n{YELLOW}[Secretary Agent]: No hay tareas pendientes por completar.{RESET}\n")
        else:
            task_title = re.sub(r'^(crear|recordar|agregar|agendar|añadir|nueva|tarea|de|que)\s*', '', prompt, flags=re.IGNORECASE).strip() or prompt
            task_title = task_title.capitalize()
            t_id = f"task_cli_{int(datetime.datetime.now().timestamp()*1000)}"
            cursor.execute("INSERT INTO tasks (id, title, priority, category, completed, assigned_to) VALUES (?, ?, 'medium', 'general', 0, 'Secretary Agent');", (t_id, task_title))
            conn.commit()
            print(f"\n{GREEN}✓ [Secretary Agent]: Tarea '{task_title}' agendada exitosamente.{RESET}\n")
    else:
        amount_match = re.search(r'(?:(?:de|\$)\s*)?(\d+(?:[.,]\d+)?)', prompt)
        amount = float(amount_match.group(1).replace(',', '.')) if amount_match else 45.0
        tx_id = f"tx_cli_{int(datetime.datetime.now().timestamp()*1000)}"
        now_date = datetime.datetime.now().strftime("%Y-%m-%d")
        acc_id = "acc_checking"
        cursor.execute("INSERT INTO transactions (id, title, amount, type, category, account_id, date, merchant, status) VALUES (?, ?, ?, 'expense', 'food_dining', ?, ?, 'Comando Terminal', 'completed');", (tx_id, prompt, amount, acc_id, now_date))
        cursor.execute("UPDATE accounts SET balance = MAX(0, balance - ?) WHERE id = ?;", (amount, acc_id))
        conn.commit()
        print(f"\n{GREEN}✓ [Financial Agent]: Gasto de ${amount:.2f} registrado en Cuenta Operativa Principal.{RESET}\n")

    conn.close()

def main_menu():
    while True:
        print_header()
        show_overview()

        print(f"{BOLD}MENÚ PRINCIPAL TERMINAL:{RESET}")
        print(f" {CYAN}1.{RESET} Consultar Transacciones")
        print(f" {CYAN}2.{RESET} Ver Agenda de Tareas (Secretaria)")
        print(f" {CYAN}3.{RESET} Ejecutar Comando de Voz / Prompt a los Agentes")
        print(f" {CYAN}4.{RESET} Simular Webhook de Pago (Zero-Friction)")
        print(f" {CYAN}5.{RESET} Salir de la Terminal\n")

        choice = input(f"{BOLD}Selecciona una opción [1-5]: {RESET}").strip()

        if choice == "1":
            show_transactions()
            input("Presiona Enter para continuar...")
        elif choice == "2":
            show_tasks()
            input("Presiona Enter para continuar...")
        elif choice == "3":
            process_voice_or_prompt()
            input("Presiona Enter para continuar...")
        elif choice == "4":
            merchant = input("Nombre del Comercio (ej. Starbucks): ").strip() or "Starbucks Coffee"
            amount_str = input("Monto USD (ej. 35.50): ").strip() or "35.50"
            amount = float(amount_str)

            conn = get_db()
            cursor = conn.cursor()
            tx_id = f"tx_cli_{int(datetime.datetime.now().timestamp()*1000)}"
            now_date = datetime.datetime.now().strftime("%Y-%m-%d")
            acc_id = "acc_checking"
            cursor.execute("INSERT INTO transactions (id, title, amount, type, category, account_id, date, merchant, status) VALUES (?, ?, ?, 'expense', 'food_dining', ?, ?, ?, 'completed');", (tx_id, f"Pago Automático: {merchant}", amount, acc_id, now_date, merchant))
            cursor.execute("UPDATE accounts SET balance = MAX(0, balance - ?) WHERE id = ?;", (amount, acc_id))
            wh_id = f"wh_cli_{int(datetime.datetime.now().timestamp()*1000)}"
            cursor.execute("INSERT INTO webhook_events (id, source, payload, parsed_amount, parsed_merchant, status, transaction_id) VALUES (?, 'AppleShortcuts_iOS', ?, ?, ?, 'processed', ?);", (wh_id, f"Simulado CLI: ${amount}", amount, merchant, tx_id))
            conn.commit()
            conn.close()

            print(f"\n{GREEN}⚡ Webhook Cero-Fricción procesado: Pago de ${amount:.2f} en {merchant} registrado sin interacción.{RESET}\n")
            input("Presiona Enter para continuar...")
        elif choice == "5":
            print(f"\n{GREEN}¡Hasta pronto!{RESET}")
            break

if __name__ == "__main__":
    main_menu()
