import React from 'react';
import {
  X,
  Calendar,
  Clock,
  Building2,
  Tag,
  CreditCard,
  FileText,
  Trash2,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { Account, Transaction } from '../types';
import { CATEGORIES } from '../data/initialData';
import { formatCurrency, formatDateSpanish } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  account?: Account;
  privacyMode: boolean;
  onDeleteTransaction: (id: string) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
  account,
  privacyMode,
  onDeleteTransaction,
}) => {
  if (!transaction) return null;

  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';
  const catMeta = CATEGORIES[transaction.category] || CATEGORIES.other;

  const handleCopyId = () => {
    navigator.clipboard?.writeText(transaction.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1C30]/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#0F172A]/10 overflow-hidden">
        {/* Receipt Header Banner */}
        <div className="p-6 bg-gradient-to-b from-[#F8FAFC] to-white border-b border-[#0F172A]/8 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-[#64748B] hover:text-[#0B1C30] hover:bg-slate-200/50 transition-colors"
          >
            <X size={18} />
          </button>

          <div
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-sm mb-3"
            style={{ backgroundColor: `${catMeta.color}15`, color: catMeta.color }}
          >
            <CategoryIcon category={transaction.category} size={28} />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            {isIncome ? 'Abono Registrado' : isTransfer ? 'Movimiento entre Bóvedas' : 'Cargo Facturado'}
          </span>

          <div
            className={`text-2xl sm:text-3xl font-bold font-display tabular-nums mt-1 ${
              isIncome
                ? 'text-[#10B981]'
                : isTransfer
                ? 'text-[#1E293B]'
                : 'text-[#0B1C30]'
            }`}
          >
            {isIncome ? '+' : isTransfer ? '' : '-'}
            {formatCurrency(transaction.amount, 'USD', privacyMode)}
          </div>

          <h2 className="text-sm font-semibold text-[#0B1C30] mt-1">
            {transaction.title}
          </h2>
        </div>

        {/* Receipt Line Items */}
        <div className="p-6 space-y-3.5 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-[#0F172A]/5">
            <span className="text-[#64748B] flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-[#10B981]" />
              Estado de la transacción
            </span>
            <span className="font-semibold text-[#0D5C4D] bg-[#0D5C4D]/10 px-2 py-0.5 rounded-full capitalize">
              {transaction.status === 'completed' ? 'Completado & Conciliado' : 'Pendiente'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-[#0F172A]/5">
            <span className="text-[#64748B] flex items-center gap-1.5">
              <Calendar size={14} />
              Fecha y Hora
            </span>
            <span className="font-semibold text-[#0B1C30]">
              {formatDateSpanish(transaction.date)} {transaction.date} &bull; {transaction.time || '12:00'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-[#0F172A]/5">
            <span className="text-[#64748B] flex items-center gap-1.5">
              <Tag size={14} />
              Categoría
            </span>
            <span className="font-semibold text-[#0B1C30]">
              {catMeta.label}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-[#0F172A]/5">
            <span className="text-[#64748B] flex items-center gap-1.5">
              <CreditCard size={14} />
              Bóveda / Cuenta
            </span>
            <span className="font-semibold text-[#0B1C30]">
              {account ? `${account.name} (${account.accountNumberMasked})` : 'Cuenta Operativa'}
            </span>
          </div>

          {transaction.merchant && (
            <div className="flex items-center justify-between py-1.5 border-b border-[#0F172A]/5">
              <span className="text-[#64748B] flex items-center gap-1.5">
                <Building2 size={14} />
                Comercio / Entidad
              </span>
              <span className="font-semibold text-[#0B1C30]">
                {transaction.merchant}
              </span>
            </div>
          )}

          {transaction.notes && (
            <div className="py-1.5 border-b border-[#0F172A]/5 space-y-1">
              <span className="text-[#64748B] flex items-center gap-1.5">
                <FileText size={14} />
                Nota adjunta
              </span>
              <p className="text-[#0B1C30] font-medium bg-[#F8FAFC] p-2.5 rounded-xl border border-[#0F172A]/5">
                {transaction.notes}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[#94A3B8]">ID de Referencia</span>
            <button
              onClick={handleCopyId}
              className="text-[#64748B] hover:text-[#0B1C30] font-mono text-[11px] flex items-center gap-1"
            >
              <span>{transaction.id}</span>
              <Copy size={11} />
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#0F172A]/8 flex items-center justify-between">
          <button
            onClick={() => {
              onDeleteTransaction(transaction.id);
              onClose();
            }}
            className="text-xs font-semibold text-[#EF4444] hover:bg-[#EF4444]/10 px-3 py-2 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Trash2 size={14} />
            <span>Eliminar registro</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#0D5C4D] hover:bg-[#094539] transition-all"
          >
            Cerrar Recibo
          </button>
        </div>
      </div>
    </div>
  );
};
