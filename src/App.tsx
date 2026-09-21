import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { OverviewTab } from './components/OverviewTab';
import { TransactionsTab } from './components/TransactionsTab';
import { BudgetsTab } from './components/BudgetsTab';
import { AccountsTab } from './components/AccountsTab';
import { VoiceCommandTab } from './components/VoiceCommandTab';
import { AIChatTab } from './components/AIChatTab';
import { SecretaryTab } from './components/SecretaryTab';
import { PaymentAutomationTab } from './components/PaymentAutomationTab';
import { TailscaleModal } from './components/TailscaleModal';
import { FloatingAssistantDock } from './components/FloatingAssistantDock';
import { AddTransactionModal } from './components/AddTransactionModal';
import { TransferModal } from './components/TransferModal';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import {
  INITIAL_ACCOUNTS,
  INITIAL_BUDGETS,
  INITIAL_TRANSACTIONS,
} from './data/initialData';
import { Account, Budget, Transaction, Task, EmailNotification, WebhookEvent, AppTab } from './types';
import { Check } from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<AppTab>('overview');

  // Privacy Mode (conceals monetary values for discretion)
  const [privacyMode, setPrivacyMode] = useState<boolean>(() => {
    return localStorage.getItem('mw_privacy_mode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('mw_privacy_mode', String(privacyMode));
  }, [privacyMode]);

  // Accounts state
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('mw_accounts');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  useEffect(() => {
    localStorage.setItem('mw_accounts', JSON.stringify(accounts));
  }, [accounts]);

  // Budgets state
  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('mw_budgets');
    return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
  });

  useEffect(() => {
    localStorage.setItem('mw_budgets', JSON.stringify(budgets));
  }, [budgets]);

  // Transactions state
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('mw_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  useEffect(() => {
    localStorage.setItem('mw_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Secretary Tasks state
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('mw_tasks');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'task_01',
            title: 'Revisar reporte de rendimiento mensual Bóveda Vanguard',
            description: 'Analizar asignación de activos con el Agente Financiero',
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
        ];
  });

  useEffect(() => {
    localStorage.setItem('mw_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Emails & Notifications state
  const [emails, setEmails] = useState<EmailNotification[]>(() => {
    const saved = localStorage.getItem('mw_emails');
    return saved
      ? JSON.parse(saved)
      : [
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
        ];
  });

  useEffect(() => {
    localStorage.setItem('mw_emails', JSON.stringify(emails));
  }, [emails]);

  // Webhook Events state
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>(() => {
    const saved = localStorage.getItem('mw_webhooks');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'wh_init_1',
            source: 'AppleShortcuts_iOS',
            payload: 'Notificación Bancaria: Compra autorizada por $45.00 en Starbucks Coffee',
            parsedAmount: 45.0,
            parsedMerchant: 'Starbucks Coffee',
            status: 'processed',
            createdAt: '2026-09-15 14:10',
          },
        ];
  });

  useEffect(() => {
    localStorage.setItem('mw_webhooks', JSON.stringify(webhookEvents));
  }, [webhookEvents]);

  // Selected view account
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

  // Modals state
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [addTxPrefillType, setAddTxPrefillType] = useState<'expense' | 'income'>('expense');
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isTailscaleModalOpen, setIsTailscaleModalOpen] = useState(false);
  const [selectedTxForDetail, setSelectedTxForDetail] = useState<Transaction | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync state with server DB if endpoint available
  const refreshServerData = async () => {
    try {
      const res = await fetch('/api/data/all');
      if (res.ok) {
        const data = await res.json();
        if (data.accounts) setAccounts(data.accounts);
        if (data.transactions) setTransactions(data.transactions);
        if (data.tasks) setTasks(data.tasks);
        if (data.emails) setEmails(data.emails);
        if (data.webhookEvents) setWebhookEvents(data.webhookEvents);
      }
    } catch (err) {
      // Offline / Client standalone fallback
    }
  };

  useEffect(() => {
    refreshServerData();
  }, []);

  // Total net worth
  const totalNetWorth = accounts.reduce((acc, a) => acc + a.balance, 0);

  // Filter transactions according to selected account (if filtered in header)
  const displayedTransactions =
    selectedAccountId === 'all'
      ? transactions
      : transactions.filter((t) => t.accountId === selectedAccountId || t.toAccountId === selectedAccountId);

  // Handlers
  const handleOpenAddTransaction = (prefillType: 'expense' | 'income' = 'expense') => {
    setAddTxPrefillType(prefillType);
    setIsAddTxOpen(true);
  };

  const handleAddTransaction = (newTxData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...newTxData,
      id: `tx_${Date.now()}`,
    };

    // Update account balance
    setAccounts((prevAccounts) =>
      prevAccounts.map((acc) => {
        if (acc.id === newTx.accountId) {
          const delta = newTx.type === 'income' ? newTx.amount : -newTx.amount;
          return {
            ...acc,
            balance: Math.max(0, acc.balance + delta),
          };
        }
        return acc;
      })
    );

    setTransactions((prev) => [newTx, ...prev]);
    showToast(
      newTx.type === 'income'
        ? `Ingreso de $${newTx.amount.toFixed(2)} registrado correctamente`
        : `Gasto de $${newTx.amount.toFixed(2)} registrado correctamente`
    );
  };

  const handleExecuteTransfer = (
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    note: string
  ) => {
    const fromAcc = accounts.find((a) => a.id === fromAccountId);
    const toAcc = accounts.find((a) => a.id === toAccountId);

    if (!fromAcc || !toAcc) return;

    setAccounts((prevAccounts) =>
      prevAccounts.map((acc) => {
        if (acc.id === fromAccountId) {
          return { ...acc, balance: acc.balance - amount };
        }
        if (acc.id === toAccountId) {
          return { ...acc, balance: acc.balance + amount };
        }
        return acc;
      })
    );

    const transferTx: Transaction = {
      id: `tx_tr_${Date.now()}`,
      title: `Transferencia: ${fromAcc.name} → ${toAcc.name}`,
      amount,
      type: 'transfer',
      category: 'transfers',
      accountId: fromAccountId,
      toAccountId,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      merchant: 'Transferencia Interna',
      notes: note,
      status: 'completed',
    };

    setTransactions((prev) => [transferTx, ...prev]);
    showToast(`Transferencia de $${amount.toFixed(2)} completada con éxito`);
  };

  const handleDeleteTransaction = (txId: string) => {
    const tx = transactions.find((t) => t.id === txId);
    if (!tx) return;

    setAccounts((prevAccounts) =>
      prevAccounts.map((acc) => {
        if (acc.id === tx.accountId) {
          if (tx.type === 'income') {
            return { ...acc, balance: Math.max(0, acc.balance - tx.amount) };
          } else if (tx.type === 'expense') {
            return { ...acc, balance: acc.balance + tx.amount };
          } else if (tx.type === 'transfer' && tx.toAccountId) {
            return { ...acc, balance: acc.balance + tx.amount };
          }
        }
        if (tx.type === 'transfer' && tx.toAccountId && acc.id === tx.toAccountId) {
          return { ...acc, balance: Math.max(0, acc.balance - tx.amount) };
        }
        return acc;
      })
    );

    setTransactions((prev) => prev.filter((t) => t.id !== txId));
    showToast('Registro de movimiento eliminado');
  };

  const handleUpdateBudget = (budgetId: string, newAmount: number) => {
    setBudgets((prev) =>
      prev.map((b) => (b.id === budgetId ? { ...b, allocatedAmount: newAmount } : b))
    );
    showToast('Límite presupuestario actualizado');
  };

  const handleAddBudget = (newBudget: Budget) => {
    setBudgets((prev) => [...prev, newBudget]);
    showToast(`Partida "${newBudget.label}" añadida con éxito`);
  };

  const handleToggleFreezeCard = (accountId: string) => {
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId ? { ...acc, cardFrozen: !acc.cardFrozen } : acc
      )
    );
    const targetAcc = accounts.find((a) => a.id === accountId);
    if (targetAcc) {
      showToast(
        targetAcc.cardFrozen
          ? 'Tarjeta desbloqueada para operaciones'
          : 'Tarjeta bloqueada preventivamente'
      );
    }
  };

  // Secretary Handlers
  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: `task_${Date.now()}`,
      createdAt: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    };
    setTasks((prev) => [newTask, ...prev]);

    // Send to backend endpoint
    fetch('/api/secretary/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTaskData),
    }).catch(() => {});
  };

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
    fetch(`/api/secretary/tasks/${taskId}/toggle`, { method: 'PATCH' }).catch(() => {});
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    fetch(`/api/secretary/tasks/${taskId}`, { method: 'DELETE' }).catch(() => {});
  };

  const handleMarkEmailRead = (emailId: string) => {
    setEmails((prev) =>
      prev.map((e) => (e.id === emailId ? { ...e, isRead: true } : e))
    );
  };

  // Zero-Friction Webhook Simulation Trigger
  const handleTriggerSimulatedWebhook = async (payload: {
    merchant: string;
    amount: number;
    source: string;
  }) => {
    const res = await fetch('/api/webhooks/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      await refreshServerData();
    } else {
      // Fallback in client state
      const fallbackTx: Transaction = {
        id: `tx_wh_${Date.now()}`,
        title: `Pago Automático: ${payload.merchant}`,
        amount: payload.amount,
        type: 'expense',
        category: 'food_dining',
        accountId: accounts[0]?.id || 'acc_checking',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        merchant: payload.merchant,
        notes: `Registrado automáticamente vía Webhook (${payload.source})`,
        status: 'completed',
      };

      setAccounts((prev) =>
        prev.map((acc, idx) =>
          idx === 0 ? { ...acc, balance: Math.max(0, acc.balance - payload.amount) } : acc
        )
      );
      setTransactions((prev) => [fallbackTx, ...prev]);

      const newWh: WebhookEvent = {
        id: `wh_${Date.now()}`,
        source: payload.source,
        payload: `Notificación Banco: Compra de $${payload.amount} en ${payload.merchant}`,
        parsedAmount: payload.amount,
        parsedMerchant: payload.merchant,
        status: 'processed',
        createdAt: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      };
      setWebhookEvents((prev) => [newWh, ...prev]);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B1C30] flex flex-col font-sans">
      {/* Top Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        privacyMode={privacyMode}
        setPrivacyMode={setPrivacyMode}
        totalNetWorth={totalNetWorth}
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        setSelectedAccountId={setSelectedAccountId}
        onOpenAddTransaction={() => handleOpenAddTransaction('expense')}
        onOpenTransfer={() => setIsTransferOpen(true)}
        onOpenTailscaleModal={() => setIsTailscaleModalOpen(true)}
      />

      {/* Main Container constrained to max-w-7xl with 8-point rhythmic grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'overview' && (
          <OverviewTab
            totalNetWorth={totalNetWorth}
            accounts={accounts}
            budgets={budgets}
            transactions={displayedTransactions}
            privacyMode={privacyMode}
            onOpenAddTransaction={handleOpenAddTransaction}
            onOpenTransfer={() => setIsTransferOpen(true)}
            onSelectTransaction={(tx) => setSelectedTxForDetail(tx)}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsTab
            transactions={displayedTransactions}
            accounts={accounts}
            privacyMode={privacyMode}
            onSelectTransaction={(tx) => setSelectedTxForDetail(tx)}
            onOpenAddTransaction={() => handleOpenAddTransaction('expense')}
          />
        )}

        {activeTab === 'budgets' && (
          <BudgetsTab
            budgets={budgets}
            transactions={transactions}
            privacyMode={privacyMode}
            onUpdateBudget={handleUpdateBudget}
            onAddBudget={handleAddBudget}
          />
        )}

        {activeTab === 'accounts' && (
          <AccountsTab
            accounts={accounts}
            transactions={transactions}
            privacyMode={privacyMode}
            onOpenTransfer={() => setIsTransferOpen(true)}
            onToggleFreezeCard={handleToggleFreezeCard}
          />
        )}

        {activeTab === 'secretary' && (
          <SecretaryTab
            tasks={tasks}
            emails={emails}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            onMarkEmailRead={handleMarkEmailRead}
            showToast={showToast}
          />
        )}

        {activeTab === 'webhooks' && (
          <PaymentAutomationTab
            webhookEvents={webhookEvents}
            onTriggerSimulatedWebhook={handleTriggerSimulatedWebhook}
            showToast={showToast}
          />
        )}

        {activeTab === 'voice' && (
          <VoiceCommandTab
            accounts={accounts}
            budgets={budgets}
            transactions={transactions}
            totalNetWorth={totalNetWorth}
            privacyMode={privacyMode}
            onAddTransaction={handleAddTransaction}
            onExecuteTransfer={handleExecuteTransfer}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onTogglePrivacy={(val) =>
              setPrivacyMode((prev) => (typeof val === 'boolean' ? val : !prev))
            }
            onToggleFreezeCard={handleToggleFreezeCard}
            showToast={showToast}
          />
        )}

        {activeTab === 'chat' && (
          <AIChatTab
            accounts={accounts}
            budgets={budgets}
            transactions={transactions}
            totalNetWorth={totalNetWorth}
            privacyMode={privacyMode}
            onAddTransaction={handleAddTransaction}
            onExecuteTransfer={handleExecuteTransfer}
            showToast={showToast}
          />
        )}
      </main>

      {/* Footer info bar */}
      <footer className="border-t border-[#0F172A]/8 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          <div className="flex items-center gap-2">
            <img src="/app-icon.svg" alt="Wealth & Balance" className="w-5 h-5 rounded-md" />
            <span className="font-semibold text-[#0B1C30]">Modern Wealth &amp; Balance</span>
            <span>&bull;</span>
            <span>Orquestador Multi-Agente &amp; Conectividad Tailscale</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsTailscaleModalOpen(true)}
              className="inline-flex items-center gap-1 text-[#0D5C4D] font-medium hover:underline"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
              Tailscale IP Ready &bull; Cifrado WireGuard
            </button>
            <button
              onClick={() => setPrivacyMode((p) => !p)}
              className="hover:text-[#0B1C30] underline"
            >
              {privacyMode ? 'Desactivar Modo Discreción' : 'Activar Modo Discreción'}
            </button>
          </div>
        </div>
      </footer>

      {/* Persistent Floating Quick-Access Dock */}
      <FloatingAssistantDock
        activeTab={activeTab}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#0B1C30] text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-xl border border-white/10 animate-bounce">
          <div className="w-5 h-5 rounded-full bg-[#10B981] text-[#00201A] flex items-center justify-center flex-shrink-0">
            <Check size={12} strokeWidth={3} />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        accounts={accounts}
        initialType={addTxPrefillType}
        onAddTransaction={handleAddTransaction}
      />

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        accounts={accounts}
        onExecuteTransfer={handleExecuteTransfer}
      />

      <TransactionDetailModal
        transaction={selectedTxForDetail}
        onClose={() => setSelectedTxForDetail(null)}
        account={accounts.find((a) => a.id === selectedTxForDetail?.accountId)}
        privacyMode={privacyMode}
        onDeleteTransaction={handleDeleteTransaction}
      />

      <TailscaleModal
        isOpen={isTailscaleModalOpen}
        onClose={() => setIsTailscaleModalOpen(false)}
        showToast={showToast}
      />
    </div>
  );
}
