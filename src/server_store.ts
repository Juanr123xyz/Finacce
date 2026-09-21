import fs from 'fs';
import path from 'path';
import { Account, Budget, Transaction, Task, EmailNotification, WebhookEvent } from './types';
import { INITIAL_ACCOUNTS, INITIAL_BUDGETS, INITIAL_TRANSACTIONS } from './data/initialData';

const STORE_FILE = path.join(process.cwd(), 'data_store.json');

export interface AppDatabase {
  accounts: Account[];
  budgets: Budget[];
  transactions: Transaction[];
  tasks: Task[];
  emails: EmailNotification[];
  webhookEvents: WebhookEvent[];
}

const INITIAL_TASKS: Task[] = [
  {
    id: 'task_01',
    title: 'Revisar reporte de rendimiento mensual Bóveda Vanguard',
    description: 'Analizar asignación de activos e interés compuesto con el Agente Financiero',
    dueDate: '2026-09-18',
    priority: 'high',
    category: 'finances',
    completed: false,
    assignedTo: 'Secretary Agent',
    createdAt: '2026-09-15 10:00',
  },
  {
    id: 'task_02',
    title: 'Programar pago de seguro de gastos médicos mayores',
    description: 'Verificar cuota aprobada en presupuesto de salud',
    dueDate: '2026-09-20',
    priority: 'medium',
    category: 'bills',
    completed: false,
    assignedTo: 'Secretary Agent',
    createdAt: '2026-09-14 15:30',
  },
  {
    id: 'task_03',
    title: 'Organizar comprobantes de deducciones de impuestos Q3',
    description: 'Archivar notificaciones bancarias recibidas via Webhook',
    dueDate: '2026-09-25',
    priority: 'low',
    category: 'taxes',
    completed: true,
    assignedTo: 'Secretary Agent',
    createdAt: '2026-09-10 09:15',
  },
];

const INITIAL_EMAILS: EmailNotification[] = [
  {
    id: 'email_01',
    sender: 'notificaciones@apexwealth.com',
    subject: 'Aviso de Pago Automático: Mercado Orgánico $142.60',
    body: 'Se ha procesado exitosamente la transacción con su tarjeta de débito terminación 4829.',
    category: 'bank_alert',
    isRead: true,
    actionTaken: 'Registrado automáticamente en Finanzas',
    receivedAt: '2026-09-14 18:46',
  },
  {
    id: 'email_02',
    sender: 'servicios@vanguardtreasury.com',
    subject: 'Estado de Cuenta Trimestral Disponible - Bóveda ETF',
    body: 'Su resumen de inversión del periodo anterior se encuentra listo para descarga.',
    category: 'receipt',
    isRead: false,
    receivedAt: '2026-09-13 11:20',
  },
  {
    id: 'email_03',
    sender: 'secretaria.ai@modernwealth.app',
    subject: 'Recordatorio Agendado: Revisión de Partida de Ocio',
    body: 'Has alcanzado el 70% del límite presupuestado en la partida Ocio & Experiencias.',
    category: 'reminder',
    isRead: false,
    actionTaken: 'Alerta enviada al usuario',
    receivedAt: '2026-09-12 08:00',
  },
];

const INITIAL_WEBHOOKS: WebhookEvent[] = [
  {
    id: 'wh_init_1',
    source: 'AppleShortcuts_iOS',
    payload: 'Notificación Bancaria: Compra autorizada por $45.00 en Starbucks Coffee con tarjeta 4829',
    parsedAmount: 45.0,
    parsedMerchant: 'Starbucks Coffee',
    status: 'processed',
    transactionId: 'tx_03',
    createdAt: '2026-09-15 14:10',
  },
];

class DatabaseStore {
  private db: AppDatabase;

  constructor() {
    this.db = this.loadStore();
  }

  private loadStore(): AppDatabase {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Error al leer data_store.json, inicializando datos por defecto:', err);
    }

    const defaultDb: AppDatabase = {
      accounts: INITIAL_ACCOUNTS,
      budgets: INITIAL_BUDGETS,
      transactions: INITIAL_TRANSACTIONS,
      tasks: INITIAL_TASKS,
      emails: INITIAL_EMAILS,
      webhookEvents: INITIAL_WEBHOOKS,
    };

    this.saveStore(defaultDb);
    return defaultDb;
  }

  public saveStore(data?: AppDatabase): void {
    if (data) this.db = data;
    try {
      fs.writeFileSync(STORE_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error al guardar data_store.json:', err);
    }
  }

  public getDb(): AppDatabase {
    return this.db;
  }

  // Transactions & Accounts
  public addTransaction(tx: Transaction): void {
    this.db.transactions.unshift(tx);

    // Update account balance
    this.db.accounts = this.db.accounts.map((acc) => {
      if (acc.id === tx.accountId) {
        const delta = tx.type === 'income' ? tx.amount : -tx.amount;
        return { ...acc, balance: Math.max(0, acc.balance + delta) };
      }
      if (tx.type === 'transfer' && tx.toAccountId && acc.id === tx.toAccountId) {
        return { ...acc, balance: acc.balance + tx.amount };
      }
      return acc;
    });

    this.saveStore();
  }

  public addTransfer(fromId: string, toId: string, amount: number, note: string): Transaction | null {
    const fromAcc = this.db.accounts.find((a) => a.id === fromId);
    const toAcc = this.db.accounts.find((a) => a.id === toId);
    if (!fromAcc || !toAcc) return null;

    this.db.accounts = this.db.accounts.map((acc) => {
      if (acc.id === fromId) return { ...acc, balance: acc.balance - amount };
      if (acc.id === toId) return { ...acc, balance: acc.balance + amount };
      return acc;
    });

    const tx: Transaction = {
      id: `tx_tr_${Date.now()}`,
      title: `Transferencia: ${fromAcc.name} → ${toAcc.name}`,
      amount,
      type: 'transfer',
      category: 'transfers',
      accountId: fromId,
      toAccountId: toId,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      merchant: 'Transferencia Interna',
      notes: note,
      status: 'completed',
    };

    this.db.transactions.unshift(tx);
    this.saveStore();
    return tx;
  }

  public toggleFreezeCard(accountId: string): boolean {
    let newStatus = false;
    this.db.accounts = this.db.accounts.map((acc) => {
      if (acc.id === accountId) {
        newStatus = !acc.cardFrozen;
        return { ...acc, cardFrozen: newStatus };
      }
      return acc;
    });
    this.saveStore();
    return newStatus;
  }

  // Tasks (Secretary Agent)
  public addTask(task: Omit<Task, 'id' | 'createdAt'>): Task {
    const newTask: Task = {
      ...task,
      id: `task_${Date.now()}`,
      createdAt: new Date().toLocaleString('es-ES'),
    };
    this.db.tasks.unshift(newTask);
    this.saveStore();
    return newTask;
  }

  public toggleTaskCompleted(taskId: string): Task | null {
    let updated: Task | null = null;
    this.db.tasks = this.db.tasks.map((t) => {
      if (t.id === taskId) {
        updated = { ...t, completed: !t.completed };
        return updated;
      }
      return t;
    });
    this.saveStore();
    return updated;
  }

  public deleteTask(taskId: string): void {
    this.db.tasks = this.db.tasks.filter((t) => t.id !== taskId);
    this.saveStore();
  }

  // Emails & Notifications (Secretary Agent)
  public addEmail(email: Omit<EmailNotification, 'id' | 'receivedAt'>): EmailNotification {
    const newEmail: EmailNotification = {
      ...email,
      id: `email_${Date.now()}`,
      receivedAt: new Date().toLocaleString('es-ES'),
    };
    this.db.emails.unshift(newEmail);
    this.saveStore();
    return newEmail;
  }

  public markEmailRead(emailId: string): void {
    this.db.emails = this.db.emails.map((e) => (e.id === emailId ? { ...e, isRead: true } : e));
    this.saveStore();
  }

  // Webhooks
  public addWebhookEvent(event: Omit<WebhookEvent, 'id' | 'createdAt'>): WebhookEvent {
    const newEvent: WebhookEvent = {
      ...event,
      id: `wh_${Date.now()}`,
      createdAt: new Date().toLocaleString('es-ES'),
    };
    this.db.webhookEvents.unshift(newEvent);
    this.saveStore();
    return newEvent;
  }
}

export const dbStore = new DatabaseStore();
