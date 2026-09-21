export type TransactionType = 'expense' | 'income' | 'transfer';

export type TransactionCategory =
  | 'salary'
  | 'investments'
  | 'food_dining'
  | 'housing'
  | 'transport'
  | 'technology'
  | 'leisure'
  | 'health'
  | 'transfers'
  | 'other';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  accountId: string;
  toAccountId?: string;
  date: string; // ISO string or YYYY-MM-DD
  time?: string;
  merchant?: string;
  notes?: string;
  status: 'completed' | 'pending';
}

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'investment' | 'crypto';
  accountNumberMasked: string;
  balance: number;
  currency: string;
  apy?: number;
  institution: string;
  color: string;
  cardFrozen?: boolean;
}

export interface Budget {
  id: string;
  category: TransactionCategory;
  label: string;
  allocatedAmount: number;
  period: 'monthly' | 'weekly';
  color: string;
}

export interface BalanceHistoryPoint {
  date: string;
  balance: number;
  inflow: number;
  outflow: number;
}

export type AppTab =
  | 'overview'
  | 'transactions'
  | 'budgets'
  | 'accounts'
  | 'voice'
  | 'chat'
  | 'secretary'
  | 'webhooks';

export type AgentType = 'financial' | 'secretary' | 'orchestrator';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  agent?: AgentType;
  suggestedAction?: {
    type: 'add_transaction' | 'transfer' | 'adjust_budget' | 'create_task' | 'process_webhook';
    payload: any;
    executed?: boolean;
  };
}

export interface VoiceCommandLog {
  id: string;
  transcript: string;
  intent: string;
  agent?: AgentType;
  response: string;
  timestamp: string;
  success: boolean;
  executedAction?: string;
}

// Secretary Agent Models
export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  completed: boolean;
  assignedTo: string;
  createdAt: string;
}

export interface EmailNotification {
  id: string;
  sender: string;
  subject: string;
  body: string;
  category: 'inbox' | 'bank_alert' | 'bill' | 'receipt' | 'reminder';
  isRead: boolean;
  actionTaken?: string;
  receivedAt: string;
}

// Payment Automation Webhook Model
export interface WebhookEvent {
  id: string;
  source: string;
  payload: string;
  parsedAmount?: number;
  parsedMerchant?: string;
  status: 'processed' | 'failed' | 'ignored';
  transactionId?: string;
  createdAt: string;
}

// Tailscale & Security Status Model
export interface TailscaleStatus {
  connected: boolean;
  tailscaleIp: string;
  serverHost: string;
  port: number;
  secureAuthEnabled: boolean;
  mode: 'Tailscale Private Mesh' | 'Local Network' | 'Offline';
  latencyMs?: number;
}
