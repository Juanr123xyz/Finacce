import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import { Account } from '../types';
import { formatCurrency } from '../utils/formatters';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onExecuteTransfer: (fromAccountId: string, toAccountId: string, amount: number, note: string) => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onExecuteTransfer,
}) => {
  const [fromAccountId, setFromAccountId] = useState<string>(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState<string>(accounts[1]?.id || '');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('Rebalanceo sistemático de tesorería');

  if (!isOpen) return null;

  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const toAccount = accounts.find((a) => a.id === toAccountId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0 || fromAccountId === toAccountId) return;
    if (fromAccount && val > fromAccount.balance) {
      alert('El monto a transferir supera el saldo disponible en la cuenta origen.');
      return;
    }

    onExecuteTransfer(fromAccountId, toAccountId, val, note);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1C30]/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#0F172A]/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#0F172A]/8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowLeftRight size={18} className="text-[#0D5C4D]" />
            <span className="text-base font-bold text-[#0B1C30] font-display">
              Transferencia entre Bóvedas
            </span>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#0B1C30] p-1">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* From Account */}
          <div>
            <label className="block text-xs font-semibold text-[#0B1C30] mb-1">
              Bóveda Origen (De)
            </label>
            <select
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              className="w-full h-11 px-3 bg-[#F8FAFC] border border-[#0F172A]/10 rounded-xl text-xs font-semibold text-[#0B1C30] focus:outline-none focus:border-[#0D5C4D]"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (Saldo: ${a.balance.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-center -my-1 text-[#0D5C4D]">
            <ArrowRight size={16} className="rotate-90 sm:rotate-0" />
          </div>

          {/* To Account */}
          <div>
            <label className="block text-xs font-semibold text-[#0B1C30] mb-1">
              Bóveda Destino (Hacia)
            </label>
            <select
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="w-full h-11 px-3 bg-[#F8FAFC] border border-[#0F172A]/10 rounded-xl text-xs font-semibold text-[#0B1C30] focus:outline-none focus:border-[#0D5C4D]"
            >
              {accounts
                .filter((a) => a.id !== fromAccountId)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} (Saldo: ${a.balance.toLocaleString()})
                  </option>
                ))}
            </select>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold text-[#0B1C30] mb-1">
              Monto a Transferir (USD)
            </label>
            <div className="relative flex items-center rounded-xl border border-[#0F172A]/15 overflow-hidden focus-within:border-[#0D5C4D] focus-within:ring-2 focus-within:ring-[#0D5C4D]/15">
              <div className="h-12 px-3.5 bg-[#F8FAFC] border-r border-[#0F172A]/10 flex items-center text-xs font-bold text-[#64748B]">
                $ USD
              </div>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                placeholder="500.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-12 px-3 text-lg font-bold font-display text-[#0B1C30] tabular-nums focus:outline-none"
              />
            </div>
            {fromAccount && (
              <p className="text-[11px] text-[#64748B] mt-1">
                Saldo disponible en origen:{' '}
                <span className="font-semibold text-[#0B1C30]">
                  ${fromAccount.balance.toLocaleString()} USD
                </span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0B1C30] mb-1">
              Motivo o Concepto
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full h-11 px-3 bg-[#F8FAFC] border border-[#0F172A]/10 rounded-xl text-xs text-[#0B1C30] focus:outline-none focus:border-[#0D5C4D]"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#F1F5F9]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#0D5C4D] hover:bg-[#094539] active:scale-[0.98] transition-all shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 size={15} />
              <span>Ejecutar Transferencia</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
