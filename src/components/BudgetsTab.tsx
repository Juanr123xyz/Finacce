import React, { useState } from 'react';
import {
  PieChart as PieIcon,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Sliders,
  TrendingDown,
  TrendingUp,
  Plus,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Budget, Transaction } from '../types';
import { CATEGORIES } from '../data/initialData';
import { formatCurrency } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface BudgetsTabProps {
  budgets: Budget[];
  transactions: Transaction[];
  privacyMode: boolean;
  onUpdateBudget: (budgetId: string, newAmount: number) => void;
  onAddBudget: (newBudget: Budget) => void;
}

export const BudgetsTab: React.FC<BudgetsTabProps> = ({
  budgets,
  transactions,
  privacyMode,
  onUpdateBudget,
  onAddBudget,
}) => {
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBudgetCategory, setNewBudgetCategory] = useState<string>('other');
  const [newBudgetLabel, setNewBudgetLabel] = useState<string>('');
  const [newBudgetAmount, setNewBudgetAmount] = useState<string>('300');

  // Compute total spent per budget category
  const budgetsWithSpent = budgets.map((b) => {
    const spent = transactions
      .filter((t) => t.category === b.category && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const percentage = b.allocatedAmount > 0 ? (spent / b.allocatedAmount) * 100 : 0;
    const remaining = b.allocatedAmount - spent;

    let status: 'healthy' | 'caution' | 'exceeded' = 'healthy';
    let color = '#10B981';

    if (percentage > 90) {
      status = 'exceeded';
      color = '#EF4444';
    } else if (percentage > 75) {
      status = 'caution';
      color = '#F59E0B';
    }

    return {
      ...b,
      spent,
      remaining,
      percentage: Math.min(100, Math.round(percentage)),
      rawPercentage: percentage,
      status,
      statusColor: color,
    };
  });

  const totalAllocated = budgetsWithSpent.reduce((acc, b) => acc + b.allocatedAmount, 0);
  const totalSpent = budgetsWithSpent.reduce((acc, b) => acc + b.spent, 0);
  const totalRemaining = totalAllocated - totalSpent;
  const overallPercentage = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  // Pie chart data
  const pieChartData = budgetsWithSpent
    .filter((b) => b.spent > 0)
    .map((b) => ({
      name: b.label,
      value: Math.round(b.spent),
      color: b.color,
    }));

  // Inflows vs Outflows comparisons
  const cashflowComparison = [
    { name: 'Junio', entradas: 7400, salidas: 2900 },
    { name: 'Julio', entradas: 7600, salidas: 3000 },
    { name: 'Agosto', entradas: 8100, salidas: 2800 },
    { name: 'Septiembre', entradas: 7800, salidas: totalSpent },
  ];

  const handleStartEdit = (b: Budget) => {
    setEditingBudgetId(b.id);
    setEditAmount(b.allocatedAmount);
  };

  const handleSaveEdit = (bId: string) => {
    onUpdateBudget(bId, editAmount);
    setEditingBudgetId(null);
  };

  const handleCreateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = (newBudgetCategory as any) || 'other';
    const amount = parseFloat(newBudgetAmount) || 250;
    const label = newBudgetLabel.trim() || CATEGORIES[cat as keyof typeof CATEGORIES]?.label || 'Nuevo Presupuesto';

    onAddBudget({
      id: `b_${Date.now()}`,
      category: cat,
      label,
      allocatedAmount: amount,
      period: 'monthly',
      color: CATEGORIES[cat as keyof typeof CATEGORIES]?.color || '#0D5C4D',
    });

    setShowAddModal(false);
    setNewBudgetLabel('');
    setNewBudgetAmount('300');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header Overview & Stats Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#0F172A]/8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0B1C30] font-display">
              Presupuestos &amp; Límites Mensuales
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Control disciplinado de partidas y umbrales preventivos
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#0D5C4D] hover:bg-[#094539] active:scale-[0.98] transition-all shadow-sm self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Crear Partida</span>
          </button>
        </div>

        {/* Global Budget Meter */}
        <div className="mt-6 p-5 rounded-xl bg-[#F8FAFC] border border-[#0F172A]/5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Consumo Presupuestario Global (Septiembre)
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-[#0B1C30] font-display tabular-nums mt-0.5">
                {formatCurrency(totalSpent, 'USD', privacyMode)}
                <span className="text-base text-[#64748B] font-normal">
                  {' '}
                  / {formatCurrency(totalAllocated, 'USD', privacyMode)}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-[#64748B]">Margen Disponible:</span>
              <div
                className={`text-lg sm:text-xl font-bold font-display tabular-nums ${
                  totalRemaining >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                }`}
              >
                {formatCurrency(totalRemaining, 'USD', privacyMode)}
              </div>
            </div>
          </div>

          {/* Linear Track (Spec: Height 8px, track #E2E8F0, rounded-full) */}
          <div className="h-3 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                overallPercentage > 90
                  ? 'bg-[#EF4444]'
                  : overallPercentage > 75
                  ? 'bg-[#F59E0B]'
                  : 'bg-[#10B981]'
              }`}
              style={{ width: `${Math.min(100, overallPercentage)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>{overallPercentage}% consumido del total asignado</span>
            <span className="font-semibold text-[#0B1C30]">
              {overallPercentage <= 75
                ? 'Estado Óptimo (Healthy)'
                : overallPercentage <= 90
                ? 'Atención Requerida (Caution)'
                : 'Límite Excedido (Exceeded)'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Visual Analytics Charts: Donut Spending Breakdown + Inflow vs Outflow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Spending Distribution Donut (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-[#0F172A]/8 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0B1C30] font-display flex items-center gap-2">
              <PieIcon size={18} className="text-[#0D5C4D]" />
              <span>Distribución por Partida</span>
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Concentración del gasto real en el ciclo activo
            </p>

            <div className="h-56 w-full mt-4 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [`$${val} USD`, 'Gasto']}
                    contentStyle={{
                      backgroundColor: '#0B1C30',
                      borderRadius: '12px',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-[#64748B]">Gasto Real</span>
                <span className="text-sm font-bold text-[#0B1C30] tabular-nums font-display">
                  {formatCurrency(totalSpent, 'USD', privacyMode, true)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-[#0F172A]/5 text-xs">
            {budgetsWithSpent.slice(0, 4).map((b) => (
              <div key={b.id} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: b.color }}
                />
                <span className="truncate text-[#0B1C30] font-medium">{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Cashflow comparison Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-[#0F172A]/8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#0B1C30] font-display">
                Flujo de Caja: Entradas vs. Salidas
              </h3>
              <p className="text-xs text-[#64748B]">
                Comportamiento bimestral de ingresos consolidados frente a gastos
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981]"></span>
                <span className="text-[#64748B]">Entradas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#0D5C4D]"></span>
                <span className="text-[#64748B]">Salidas</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: number) => [`$${val.toLocaleString()} USD`]}
                  contentStyle={{
                    backgroundColor: '#0B1C30',
                    borderRadius: '12px',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="entradas" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="salidas" fill="#0D5C4D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Detailed Budget Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0B1C30] font-display">
            Desglose Detallado por Categoría
          </h2>
          <span className="text-xs text-[#64748B]">
            {budgetsWithSpent.length} presupuestos parametrizados
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgetsWithSpent.map((b) => {
            const isEditing = editingBudgetId === b.id;

            return (
              <div
                key={b.id}
                className="bg-white rounded-2xl p-5 border border-[#0F172A]/8 hover:border-[#0D5C4D]/30 shadow-sm transition-all relative overflow-hidden"
              >
                {/* Top header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${b.color}15`,
                        color: b.color,
                      }}
                    >
                      <CategoryIcon category={b.category} size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0B1C30]">{b.label}</h3>
                      <span className="text-[11px] text-[#64748B] uppercase tracking-wider">
                        {b.period === 'monthly' ? 'Mensual' : 'Semanal'}
                      </span>
                    </div>
                  </div>

                  {/* Threshold Status badge */}
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      b.status === 'exceeded'
                        ? 'bg-[#EF4444]/10 text-[#EF4444]'
                        : b.status === 'caution'
                        ? 'bg-[#F59E0B]/10 text-[#F59E0B]'
                        : 'bg-[#10B981]/10 text-[#10B981]'
                    }`}
                  >
                    {b.status === 'exceeded' ? (
                      <>
                        <AlertCircle size={12} />
                        Excedido
                      </>
                    ) : b.status === 'caution' ? (
                      <>
                        <AlertTriangle size={12} />
                        Precaución
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={12} />
                        Saludable
                      </>
                    )}
                  </span>
                </div>

                {/* Numbers */}
                <div className="mt-4 pt-3 border-t border-[#0F172A]/5 space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-[#64748B]">Ejercido:</span>
                    <span className="text-base font-bold text-[#0B1C30] font-display tabular-nums">
                      {formatCurrency(b.spent, 'USD', privacyMode)}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-[#64748B]">Asignación:</span>
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(Number(e.target.value))}
                          className="w-24 px-2 py-1 text-xs border border-[#0D5C4D] rounded font-bold text-[#0B1C30] focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveEdit(b.id)}
                          className="px-2 py-1 text-[11px] bg-[#0D5C4D] text-white rounded font-semibold"
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <span className="text-[#334155] font-semibold tabular-nums">
                        {formatCurrency(b.allocatedAmount, 'USD', privacyMode)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar track (Design spec: height 8px, track #E2E8F0, rounded-full) */}
                <div className="mt-3.5 space-y-1">
                  <div className="h-2 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300 ease-out"
                      style={{
                        width: `${b.percentage}%`,
                        backgroundColor: b.statusColor,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                    <span>{b.rawPercentage.toFixed(1)}% utilizado</span>
                    <span
                      className={b.remaining >= 0 ? 'text-[#10B981] font-medium' : 'text-[#EF4444] font-medium'}
                    >
                      {b.remaining >= 0 ? 'Resta: ' : 'Exceso: '}
                      {formatCurrency(Math.abs(b.remaining), 'USD', privacyMode)}
                    </span>
                  </div>
                </div>

                {/* Footer action */}
                <div className="mt-4 pt-3 border-t border-[#0F172A]/5 flex items-center justify-end">
                  {!isEditing && (
                    <button
                      onClick={() => handleStartEdit(b)}
                      className="text-xs font-semibold text-[#0D5C4D] hover:underline flex items-center gap-1"
                    >
                      <Sliders size={13} />
                      <span>Modificar límite</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add New Budget Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#0F172A]/10 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0B1C30] font-display">
                Nueva Partida Presupuestaria
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#94A3B8] hover:text-[#0B1C30] text-sm font-semibold p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0B1C30] mb-1">
                  Categoría
                </label>
                <select
                  value={newBudgetCategory}
                  onChange={(e) => setNewBudgetCategory(e.target.value)}
                  className="w-full h-11 px-3 bg-[#F8FAFC] border border-[#0F172A]/10 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#0D5C4D]"
                >
                  {Object.entries(CATEGORIES).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B1C30] mb-1">
                  Nombre descriptivo
                </label>
                <input
                  type="text"
                  placeholder="Ej: Suscripciones Streaming & Cloud"
                  value={newBudgetLabel}
                  onChange={(e) => setNewBudgetLabel(e.target.value)}
                  className="w-full h-11 px-3 bg-[#F8FAFC] border border-[#0F172A]/10 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#0D5C4D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B1C30] mb-1">
                  Límite mensual (USD)
                </label>
                <input
                  type="number"
                  step="10"
                  min="1"
                  required
                  value={newBudgetAmount}
                  onChange={(e) => setNewBudgetAmount(e.target.value)}
                  className="w-full h-11 px-3 bg-[#F8FAFC] border border-[#0F172A]/10 rounded-xl text-xs sm:text-sm font-bold tabular-nums focus:outline-none focus:border-[#0D5C4D]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#F1F5F9]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#0D5C4D] hover:bg-[#094539] shadow-sm"
                >
                  Guardar Partida
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
