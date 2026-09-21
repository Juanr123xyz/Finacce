import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  FileSpreadsheet,
} from 'lucide-react';
import { Account, Transaction, TransactionCategory, TransactionType } from '../types';
import { CATEGORIES } from '../data/initialData';
import { formatCurrency, formatDateSpanish } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface TransactionsTabProps {
  transactions: Transaction[];
  accounts: Account[];
  privacyMode: boolean;
  onSelectTransaction: (tx: Transaction) => void;
  onOpenAddTransaction: () => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
  accounts,
  privacyMode,
  onSelectTransaction,
  onOpenAddTransaction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory | 'all'>('all');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

  // Filtered list
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type filter
      if (selectedType !== 'all' && tx.type !== selectedType) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all' && tx.category !== selectedCategory) {
        return false;
      }
      // Account filter
      if (
        selectedAccountId !== 'all' &&
        tx.accountId !== selectedAccountId &&
        tx.toAccountId !== selectedAccountId
      ) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchTitle = tx.title.toLowerCase().includes(query);
        const matchMerchant = tx.merchant?.toLowerCase().includes(query) || false;
        const matchNotes = tx.notes?.toLowerCase().includes(query) || false;
        const matchCategory = CATEGORIES[tx.category]?.label.toLowerCase().includes(query);
        return matchTitle || matchMerchant || matchNotes || matchCategory;
      }
      return true;
    });
  }, [transactions, selectedType, selectedCategory, selectedAccountId, searchTerm]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach((tx) => {
      const dateKey = tx.date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(tx);
    });
    // Sort dates descending
    return Object.keys(groups)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map((dateKey) => ({
        date: dateKey,
        formattedDate: formatDateSpanish(dateKey),
        items: groups[dateKey],
      }));
  }, [filteredTransactions]);

  const handleExportCSV = () => {
    const headers = ['ID', 'Fecha', 'Hora', 'Título', 'Tipo', 'Categoría', 'Comercio', 'Monto', 'Cuenta', 'Notas'];
    const rows = filteredTransactions.map((tx) => [
      tx.id,
      tx.date,
      tx.time || '',
      `"${tx.title.replace(/"/g, '""')}"`,
      tx.type,
      CATEGORIES[tx.category]?.label || tx.category,
      `"${(tx.merchant || '').replace(/"/g, '""')}"`,
      tx.amount,
      tx.accountId,
      `"${(tx.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Transacciones_Finacce_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Controls Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#0F172A]/8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0B1C30] font-display">
              Registro de Transacciones
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Auditoría fiscal detallada, clasificación y recibos digitales
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#545F73] bg-[#F1F5F9] hover:bg-[#E2E8F0] active:scale-[0.98] transition-all"
            >
              <Download size={14} />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={onOpenAddTransaction}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#0D5C4D] hover:bg-[#094539] active:scale-[0.98] transition-all shadow-sm"
            >
              <Plus size={15} />
              <span>Nueva Transacción</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Type Filter Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Buscar por concepto, comercio o nota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-[#F8FAFC] border border-[#0F172A]/10 rounded-xl text-xs sm:text-sm text-[#0B1C30] placeholder-[#94A3B8] focus:outline-none focus:border-[#0D5C4D] focus:ring-2 focus:ring-[#0D5C4D]/15 transition-all"
            />
          </div>

          {/* Type Segmented Filter */}
          <div className="md:col-span-4 flex items-center bg-[#F1F5F9] p-1 rounded-xl border border-[#0F172A]/5">
            <button
              onClick={() => setSelectedType('all')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                selectedType === 'all'
                  ? 'bg-white text-[#0D5C4D] shadow-sm'
                  : 'text-[#64748B] hover:text-[#0B1C30]'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedType('expense')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                selectedType === 'expense'
                  ? 'bg-white text-[#EF4444] shadow-sm'
                  : 'text-[#64748B] hover:text-[#0B1C30]'
              }`}
            >
              <ArrowUpRight size={13} />
              Gastos
            </button>
            <button
              onClick={() => setSelectedType('income')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                selectedType === 'income'
                  ? 'bg-white text-[#10B981] shadow-sm'
                  : 'text-[#64748B] hover:text-[#0B1C30]'
              }`}
            >
              <ArrowDownRight size={13} />
              Ingresos
            </button>
            <button
              onClick={() => setSelectedType('transfer')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                selectedType === 'transfer'
                  ? 'bg-white text-[#545F73] shadow-sm'
                  : 'text-[#64748B] hover:text-[#0B1C30]'
              }`}
            >
              <ArrowLeftRight size={13} />
              Bóvedas
            </button>
          </div>

          {/* Account Filter Dropdown */}
          <div className="md:col-span-2">
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full h-11 px-3 bg-[#F8FAFC] border border-[#0F172A]/10 rounded-xl text-xs font-semibold text-[#0B1C30] focus:outline-none focus:border-[#0D5C4D]"
            >
              <option value="all">Todas las Cuentas</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Chips & Tags (Design Spec: Pill-shaped, padding 6px 12px, dot indicator, label-sm uppercase) */}
        <div className="pt-2 border-t border-[#0F172A]/5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mr-1 flex items-center gap-1 flex-shrink-0">
              <Filter size={12} />
              Categorías:
            </span>

            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                selectedCategory === 'all'
                  ? 'bg-[#0D5C4D]/10 border-[#0D5C4D] text-[#0D5C4D] font-semibold'
                  : 'bg-[#F1F5F9] border-transparent text-[#475569] hover:bg-[#E2E8F0]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              TODAS
            </button>

            {(Object.keys(CATEGORIES) as TransactionCategory[]).map((catKey) => {
              const meta = CATEGORIES[catKey];
              const isSelected = selectedCategory === catKey;

              return (
                <button
                  key={catKey}
                  onClick={() => setSelectedCategory(catKey)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-[#0D5C4D]/10 border-[#0D5C4D] text-[#0D5C4D] font-semibold'
                      : 'bg-[#F1F5F9] border-transparent text-[#475569] hover:bg-[#E2E8F0]'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="uppercase tracking-tight text-[11px]">{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grouped Transaction Feeds (Design Spec: grouped by date stamps, zero-gap list rows separated by 1px inset rules) */}
      {groupedTransactions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#0F172A]/8 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[#F1F5F9] text-[#94A3B8] flex items-center justify-center mx-auto mb-3">
            <Search size={22} />
          </div>
          <h3 className="text-base font-bold text-[#0B1C30] font-display">
            No se encontraron movimientos
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-sm mx-auto mt-1 mb-4">
            No hay registros que coincidan con los filtros o el término de búsqueda actual.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedType('all');
              setSelectedCategory('all');
              setSelectedAccountId('all');
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#0D5C4D] bg-[#0D5C4D]/10 hover:bg-[#0D5C4D]/20 transition-all"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedTransactions.map((group) => (
            <div key={group.date} className="space-y-2">
              {/* Date stamp header: label-sm, uppercase tracking, slate color */}
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  {group.formattedDate} &bull; {group.date}
                </span>
                <span className="text-xs text-[#94A3B8]">
                  {group.items.length} {group.items.length === 1 ? 'registro' : 'registros'}
                </span>
              </div>

              {/* Group Card with zero-gap rows separated by 1px inset rule */}
              <div className="bg-white rounded-2xl border border-[#0F172A]/8 shadow-sm divide-y divide-[#0F172A]/5 overflow-hidden">
                {group.items.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const isTransfer = tx.type === 'transfer';
                  const account = accounts.find((a) => a.id === tx.accountId);

                  return (
                    <div
                      key={tx.id}
                      onClick={() => onSelectTransaction(tx)}
                      className="p-4 sm:p-4.5 flex items-center justify-between gap-4 hover:bg-[#F8FAFC] transition-all cursor-pointer group"
                    >
                      {/* Left: Category Icon + Title + Metadata */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: isIncome
                              ? '#E6F9F2'
                              : isTransfer
                              ? '#F1F5F9'
                              : '#FEF3C7',
                            color: isIncome ? '#10B981' : isTransfer ? '#475569' : '#D97706',
                          }}
                        >
                          <CategoryIcon category={tx.category} size={18} />
                        </div>

                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#0B1C30] truncate group-hover:text-[#0D5C4D] transition-colors">
                            {tx.title}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B] mt-0.5">
                            {tx.merchant && (
                              <span className="font-medium text-[#334155]">{tx.merchant}</span>
                            )}
                            {tx.time && <span>{tx.time}</span>}
                            <span>&bull;</span>
                            <span className="text-[#94A3B8]">
                              {account ? account.name : 'Cuenta Primaria'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Badges */}
                      <div className="text-right flex-shrink-0">
                        <div
                          className={`text-sm sm:text-base font-bold tabular-nums font-display ${
                            isIncome
                              ? 'text-[#10B981]'
                              : isTransfer
                              ? 'text-[#1E293B]'
                              : 'text-[#0B1C30]'
                          }`}
                        >
                          {isIncome ? '+' : isTransfer ? '' : '-'}
                          {formatCurrency(tx.amount, 'USD', privacyMode)}
                        </div>
                        <div className="text-[11px] text-[#94A3B8] capitalize mt-0.5">
                          {CATEGORIES[tx.category]?.label || tx.category}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
