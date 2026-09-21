import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  TrendingUp,
  ArrowLeftRight,
  ShieldCheck,
  Check,
  Clock,
  PieChart,
  Lightbulb,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { Account, Budget, Transaction, ChatMessage } from '../types';
import { formatCurrency } from '../utils/formatters';

interface AIChatTabProps {
  accounts: Account[];
  budgets: Budget[];
  transactions: Transaction[];
  totalNetWorth: number;
  privacyMode: boolean;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onExecuteTransfer: (fromId: string, toId: string, amount: number, note: string) => void;
  showToast: (msg: string) => void;
}

export const AIChatTab: React.FC<AIChatTabProps> = ({
  accounts,
  budgets,
  transactions,
  totalNetWorth,
  privacyMode,
  onAddTransaction,
  onExecuteTransfer,
  showToast,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('mw_ai_chat');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: 'msg_welcome',
        role: 'assistant',
        content: `Hola. Soy tu **Asesor Patrimonial y Estratega Financiero de IA** en *Finacce*.\n\nHe auditado en tiempo real tu portafolio consolidado:\n* **Patrimonio Neto:** ${formatCurrency(totalNetWorth, 'USD', privacyMode)}\n* **Bóvedas Activas:** ${accounts.length} cuentas (Operativa, ETF Vanguard, HYSA con APY 4.85% y Fondo de Emergencia)\n* **Presupuestos Activos:** ${budgets.length} partidas de control\n\n¿En qué podemos trabajar hoy? Puedes pedirme análisis de gastos, estrategias de interés compuesto, optimización de partidas o registrar transacciones.`,
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem('mw_ai_chat', JSON.stringify(messages.slice(-40)));
  }, [messages]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Extract structured action if present in response
  const parseResponseActions = (rawText: string) => {
    const actionRegex = /```action\s*([\s\S]*?)\s*```/;
    const match = rawText.match(actionRegex);

    let cleanText = rawText;
    let suggestedAction = undefined;

    if (match) {
      try {
        const actionJson = JSON.parse(match[1]);
        suggestedAction = {
          type: actionJson.type,
          payload: actionJson.payload,
          executed: false,
        };
        // Clean markdown block from display text so user gets a clean prose + visual action card
        cleanText = rawText.replace(actionRegex, '').trim();
      } catch (err) {
        console.warn('Failed to parse action json:', err);
      }
    }

    return { cleanText, suggestedAction };
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputPrompt).trim();
    if (!textToSend || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputPrompt('');
    setIsLoading(true);

    try {
      // Build financial context summary
      const context = {
        totalNetWorth,
        privacyMode,
        accounts: accounts.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          balance: a.balance,
          cardFrozen: a.cardFrozen,
        })),
        budgets: budgets.map((b) => ({
          id: b.id,
          category: b.category,
          label: b.label,
          allocatedAmount: b.allocatedAmount,
        })),
        recentTransactions: transactions.slice(0, 10).map((t) => ({
          title: t.title,
          amount: t.amount,
          type: t.type,
          category: t.category,
          date: t.date,
        })),
      };

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          context,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al consultar el servicio de IA');
      }

      const data = await response.json();
      const { cleanText, suggestedAction } = parseResponseActions(data.text || '');

      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: cleanText,
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        suggestedAction,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content:
          'Lo siento, ocurrió un error procesando tu consulta con el motor de IA. Por favor verifica la conexión y vuelve a intentarlo.',
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAction = (messageId: string, action: any) => {
    if (!action || !action.payload) return;

    if (action.type === 'add_transaction') {
      const { type, amount, title, category } = action.payload;
      onAddTransaction({
        title: title || 'Gasto sugerido por IA',
        amount: Number(amount) || 0,
        type: type === 'income' ? 'income' : 'expense',
        category: category || 'general',
        accountId: accounts[0]?.id || 'acc_checking',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        merchant: 'Asesor IA',
        notes: 'Generado desde el Asistente de IA',
        status: 'completed',
      });
      showToast(`Movimiento de $${Number(amount).toFixed(2)} registrado en el portafolio`);
    } else if (action.type === 'transfer') {
      const { amount, from, to, note } = action.payload;
      const fromId = from || accounts[0]?.id;
      const toId = to || accounts[1]?.id;
      onExecuteTransfer(fromId, toId, Number(amount) || 0, note || 'Transferencia sugerida por IA');
      showToast(`Transferencia de $${Number(amount).toFixed(2)} completada`);
    }

    // Mark as executed in message state
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId && m.suggestedAction
          ? { ...m, suggestedAction: { ...m.suggestedAction, executed: true } }
          : m
      )
    );
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        role: 'assistant',
        content: 'Conversación reiniciada. ¿Qué análisis financiero o consulta patrimonial deseas realizar?',
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    showToast('Historial de chat limpiado');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0D5C4D] to-[#083B31] text-white rounded-3xl p-6 shadow-lg shadow-[#0D5C4D]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-[#A7F3D0] shadow-inner flex-shrink-0">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight font-display">
                Asesor Financiero Patrimonial IA
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#A7F3D0] border border-[#10B981]/30">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-emerald-100/80 mt-0.5">
              Análisis cuantitativo de carteras, detección de fugas, optimización de presupuestos y proyecciones.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-end">
          <div className="text-right hidden md:block">
            <span className="text-[11px] text-emerald-200 block">Contexto en vivo</span>
            <span className="text-xs font-bold text-white tabular-nums">
              {accounts.length} Bóvedas &bull; {formatCurrency(totalNetWorth, 'USD', privacyMode)}
            </span>
          </div>
          <button
            onClick={clearChat}
            title="Limpiar conversación"
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-100 hover:text-white transition-all border border-white/10"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-xs font-semibold text-[#64748B] flex items-center gap-1 flex-shrink-0 pl-1">
          <Lightbulb size={13} className="text-[#0D5C4D]" />
          <span>Sugerencias:</span>
        </span>
        {[
          'Analiza mis gastos de este mes y detecta fugas de dinero',
          '¿Cómo optimizar mi fondo de emergencia y el APY?',
          '¿Cuál es la mejor estrategia para hacer crecer mi Bóveda Vanguard?',
          'Proyéctame el impacto de ahorrar $300 más al mes a 5 años',
        ].map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading}
            className="text-xs font-medium px-3.5 py-1.5 rounded-full bg-white hover:bg-[#F1F5F9] border border-[#0F172A]/8 text-[#0B1C30] hover:text-[#0D5C4D] transition-all whitespace-nowrap shadow-2xs hover:shadow-xs flex-shrink-0 disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Window Box */}
      <div className="bg-white rounded-3xl border border-[#0F172A]/8 shadow-sm flex flex-col h-[580px] overflow-hidden">
        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <div
                key={message.id}
                className={`flex items-start gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-[#0B1C30] text-white'
                      : 'bg-[#0D5C4D] text-white shadow-sm'
                  }`}
                >
                  {isUser ? <User size={15} /> : <Sparkles size={15} className="text-[#A7F3D0]" />}
                </div>

                {/* Message Body */}
                <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-[#0D5C4D] text-white rounded-tr-xs font-medium shadow-sm'
                        : 'bg-[#F8FAFC] text-[#0B1C30] rounded-tl-xs border border-[#0F172A]/6'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <div className="markdown-body prose prose-sm max-w-none text-[#0B1C30] space-y-2 prose-headings:text-[#0B1C30] prose-p:my-1 prose-ul:my-1.5 prose-li:my-0.5 prose-strong:text-[#0D5C4D]">
                        <Markdown>{message.content}</Markdown>
                      </div>
                    )}
                  </div>

                  {/* Interactive Action Card if returned by AI */}
                  {message.suggestedAction && (
                    <div className="p-3.5 bg-[#F0FDF4] border border-[#10B981]/30 rounded-2xl text-xs shadow-xs animate-fadeIn space-y-2">
                      <div className="flex items-center justify-between text-[#065F46] font-bold">
                        <span className="flex items-center gap-1.5">
                          <DollarSign size={14} className="text-[#10B981]" />
                          <span>Acción Financiera Propuesta</span>
                        </span>
                        {message.suggestedAction.executed && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#10B981] bg-white px-2 py-0.5 rounded-md border border-[#10B981]/20">
                            <Check size={11} strokeWidth={3} />
                            <span>Aplicado</span>
                          </span>
                        )}
                      </div>

                      <div className="text-[#1F2937] text-xs">
                        {message.suggestedAction.type === 'add_transaction' && (
                          <p>
                            Registrar{' '}
                            <strong>
                              {message.suggestedAction.payload.type === 'income' ? 'ingreso' : 'gasto'} de $
                              {Number(message.suggestedAction.payload.amount).toFixed(2)}
                            </strong>{' '}
                            en concepto de "{message.suggestedAction.payload.title}".
                          </p>
                        )}
                        {message.suggestedAction.type === 'transfer' && (
                          <p>
                            Transferir{' '}
                            <strong>${Number(message.suggestedAction.payload.amount).toFixed(2)}</strong> a la
                            bóveda de destino.
                          </p>
                        )}
                      </div>

                      {!message.suggestedAction.executed && (
                        <button
                          onClick={() => handleExecuteAction(message.id, message.suggestedAction)}
                          className="w-full mt-1.5 py-2 px-3 bg-[#0D5C4D] hover:bg-[#094539] text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
                        >
                          <Check size={13} strokeWidth={2.5} />
                          <span>Aplicar esta acción a mi portafolio</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div
                    className={`flex items-center gap-1 text-[10px] text-[#94A3B8] px-1 ${
                      isUser ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <Clock size={10} />
                    <span>{message.timestamp}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading typing indicator */}
          {isLoading && (
            <div className="flex items-start gap-3.5 animate-fadeIn">
              <div className="w-8 h-8 rounded-xl bg-[#0D5C4D] text-white flex items-center justify-center flex-shrink-0">
                <Sparkles size={15} className="animate-spin text-[#A7F3D0]" />
              </div>
              <div className="bg-[#F8FAFC] border border-[#0F172A]/6 p-4 rounded-2xl rounded-tl-xs flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#0D5C4D] animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-[#0D5C4D] animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 rounded-full bg-[#0D5C4D] animate-bounce [animation-delay:0.4s]"></div>
                <span className="text-xs text-[#64748B] font-medium ml-1">Analizando tus finanzas...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-[#0F172A]/8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 sm:gap-3"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Haz una pregunta financiera, pide un análisis o solicita registrar un movimiento..."
              disabled={isLoading}
              className="flex-1 bg-[#F8FAFC] border border-[#CBD5E1] rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#0B1C30] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0D5C4D] focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isLoading}
              className="px-4 sm:px-5 py-3 bg-[#0D5C4D] hover:bg-[#094539] text-white font-semibold rounded-2xl text-xs sm:text-sm transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 active:scale-95 flex-shrink-0"
            >
              <Send size={15} />
              <span className="hidden sm:inline">Consultar</span>
            </button>
          </form>
          <div className="flex items-center justify-between text-[11px] text-[#94A3B8] mt-2 px-2">
            <span>Finacce AI &bull; Respuestas fundamentadas en tus saldos actuales</span>
            <span className="hidden sm:inline">Presiona Enter para enviar</span>
          </div>
        </div>
      </div>
    </div>
  );
};
