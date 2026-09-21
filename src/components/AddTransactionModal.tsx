import React, { useState } from 'react';
import {
  X,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Building2,
  Tag,
  FileText,
  CreditCard,
} from 'lucide-react';
import { Account, Transaction, TransactionCategory, TransactionType } from '../types';
import { CATEGORIES } from '../data/initialData';
import { CategoryIcon } from './CategoryIcon';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  initialType?: 'expense' | 'income';
  onAddTransaction: (newTx: Omit<Transaction, 'id'>) => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  accounts,
  initialType = 'expense',
  onAddTransaction,
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [category, setCategory] = useState<TransactionCategory>(
    initialType === 'income' ? 'salary' : 'food_dining'
  );
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || 'acc_checking');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return;

    onAddTransaction({
      title: title.trim() || (type === 'income' ? 'Ingreso registrado' : 'Gasto registrado'),
      amount: numericAmount,
      type,
      category,
      accountId,
      date,
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      merchant: merchant.trim() || undefined,
      notes: notes.trim() || undefined,
      status: 'completed',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1C30]/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#0F172A]/10 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#0F172A]/8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-[#0B1C30] font-display">
              Registrar Movimiento
            </span>
            <span className="text-[11px] font-semibold text-[#0D5C4D] bg-[#0D5C4D]/10 px-2 py-0.5 rounded-full uppercase">
              Tesorería
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0B1C30] hover:bg-[#F1F5F9] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Transaction Type Segmented Toggle */}
          <div className="flex items-center bg-[#F1F5F9] p-1 rounded-xl border border-[#0F172A]/5">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                if (category === 'salary') setCategory('food_dining');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                type === 'expense'
                  ? 'bg-white text-[#EF4444] shadow-sm'
                  : 'text-[#64748B] hover:text-[#0B1C30]'
              }`}
            >
              <ArrowUpRight size={14} />
              Gasto (- Salida)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory('salary');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                type === 'income'
                  ? 'bg-white text-[#10B981] shadow-sm'
                  : 'text-[#64748B] hover:text-[#0B1C30]'
              }`}
            >
              <ArrowDownRight size={14} />
              Ingreso (+ Entrada)
            </button>
          </div>

          {/* Currency Input (Design Spec: anchor currency symbol in fixed slate column with large tabular numerals) */}
          <div>
            <label className="block text-xs font-semibold text-[#0B1C30] mb-1.5">
              Monto de la Operación
            </label>
            <div className="relative flex items-center rounded-xl border border-[#0F172A]/15 overflow-hidden focus-within:border-[#0D5C4D] focus-within:ring-2 focus-within:ring-[#0D5C4D]/15 transition-all">
              <div className="h-14 px-4 bg-[#F8FAFC] border-r border-[#0F172A]/10 flex items-center justify-center text-sm font-bold text-[#64748B]">
                USD $
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                className="w-full h-14 px-4 text-2xl sm:text-3xl font-bold font-display text-[#0B1C30] tabular-nums focus:outline-none bg-white placeholder-[#94A3B8]"
              />
            </div>
          </div>

          {/* Concept / Title */}
          <div>
            <label className="block text-xs font-semibold text-[#0B1C30] mb-1.5">
              Concepto Principal
            </label>
            <input
              type="text"
              required
              placeholder={type === 'income' ? 'Ej: Honorarios Consultoría' : 'Ej: Cena de Trabajo con Clientes'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-12 px-3.5 bg-white border border-[#0F172A]/15 rounded-xl text-xs sm:text-sm text-[#0B1C30] focus:outline-none focus:border-[#0D5C4D] focus:ring-2 focus:ring-[#0D5C4D]/15 transition-all"
            />
          </div>

          {/* Category Picker with Visual Chips */}
          <div>
            <label className="block text-xs font-semibold text-[#0B1C30] mb-1.5">
              Clasificación de Partida
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
              {(Object.keys(CATEGORIES) as TransactionCategory[])
                .filter((c) => (type === 'income' ? c === 'salary' || c === 'investments' || c === 'other' : c !== 'salary'))
                .map((catKey) => {
                  const meta = CATEGORIES[catKey];
                  const isSelected = category === catKey;

                  return (
                    <button
                      type="button"
                      key={catKey}
                      onClick={() => setCategory(catKey)}
                      className={`p-2 rounded-xl text-left border text-xs flex items-center gap-2 transition-all ${
                        isSelected
                          ? 'border-[#0D5C4D] bg-[#0D5C4D]/10 text-[#0D5C4D] font-bold shadow-xs'
                          : 'border-[#0F172A]/10 bg-white text-[#475569] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <CategoryIcon category={catKey} size={15} />
                      <span className="truncate">{meta.label}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Account and Date in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0B1C30] mb-1.5 flex items-center gap-1">
                <CreditCard size={13} className="text-[#64748B]" />
                Bóveda / Cuenta
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full h-11 px-3 bg-white border border-[#0F172A]/15 rounded-xl text-xs font-semibold text-[#0B1C30] focus:outline-none focus:border-[#0D5C4D]"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.accountNumberMasked})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0B1C30] mb-1.5 flex items-center gap-1">
                <Calendar size={13} className="text-[#64748B]" />
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 px-3 bg-white border border-[#0F172A]/15 rounded-xl text-xs font-semibold text-[#0B1C30] focus:outline-none focus:border-[#0D5C4D]"
              />
            </div>
          </div>

          {/* Merchant & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0B1C30] mb-1.5 flex items-center gap-1">
                <Building2 size={13} className="text-[#64748B]" />
                Comercio / Entidad
              </label>
              <input
                type="text"
                placeholder="Ej: Apple Store, Vanguard..."
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full h-11 px-3 bg-white border border-[#0F172A]/15 rounded-xl text-xs text-[#0B1C30] focus:outline-none focus:border-[#0D5C4D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0B1C30] mb-1.5 flex items-center gap-1">
                <FileText size={13} className="text-[#64748B]" />
                Nota o Referencia
              </label>
              <input
                type="text"
                placeholder="Ej: Factura #2938"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-11 px-3 bg-white border border-[#0F172A]/15 rounded-xl text-xs text-[#0B1C30] focus:outline-none focus:border-[#0D5C4D]"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#0F172A]/8">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#0D5C4D] hover:bg-[#094539] active:scale-[0.98] transition-all shadow-md shadow-[#0D5C4D]/20"
            >
              Guardar Movimiento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
