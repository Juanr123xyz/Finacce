import React, { useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  Sparkles,
  ChevronRight,
  Download,
  Percent,
  Layers,
  Calendar,
  Mic,
  Bot,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Account, Budget, Transaction, AppTab } from '../types';
import { HISTORICAL_CHART_DATA } from '../data/initialData';
import { formatCurrency, formatDateSpanish } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface OverviewTabProps {
  totalNetWorth: number;
  accounts: Account[];
  budgets: Budget[];
  transactions: Transaction[];
  privacyMode: boolean;
  onOpenAddTransaction: (prefillType?: 'expense' | 'income') => void;
  onOpenTransfer: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  onNavigateToTab: (tab: AppTab) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  totalNetWorth,
  accounts,
  budgets,
  transactions,
  privacyMode,
  onOpenAddTransaction,
  onOpenTransfer,
  onSelectTransaction,
  onNavigateToTab,
}) => {
  const [timeRange, setTimeRange] = useState<'1S' | '1M' | '3M' | '1A' | 'TODO'>('1M');

  // Compute monthly summary
  const monthlyInflow = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyOutflow = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = monthlyInflow - monthlyOutflow;
  const savingsRate = monthlyInflow > 0 ? ((netSavings / monthlyInflow) * 100).toFixed(1) : '0';

  const chartData = HISTORICAL_CHART_DATA[timeRange];

  // Budget calculations
  const totalAllocatedBudget = budgets.reduce((acc, b) => acc + b.allocatedAmount, 0);
  const totalSpentInBudget = budgets.reduce((acc, b) => {
    const spent = transactions
      .filter((t) => t.category === b.category && t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    return acc + spent;
  }, 0);

  const budgetUsagePercent = Math.min(
    100,
    Math.round((totalSpentInBudget / totalAllocatedBudget) * 100)
  );

  const handleExportSummary = () => {
    const lines = [
      'Reporte Financiero - Finacce',
      `Fecha: ${new Date().toLocaleDateString('es-ES')}`,
      `Patrimonio Neto Total: $${totalNetWorth.toFixed(2)} USD`,
      `Entradas Mensuales: $${monthlyInflow.toFixed(2)} USD`,
      `Salidas Mensuales: $${monthlyOutflow.toFixed(2)} USD`,
      `Tasa de Ahorro: ${savingsRate}%`,
      '',
      '--- Desglose de Cuentas ---',
      ...accounts.map(
        (a) => `${a.name} (${a.accountNumberMasked}): $${a.balance.toFixed(2)} ${a.currency}`
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Finacce_Reporte_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* 1. Master Overview Card (Exact specifications from design system) */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#0D5C4D] to-[#083B31] text-white p-6 sm:p-8 shadow-xl shadow-[#0D5C4D]/15 border border-[#0D5C4D]/30">
        {/* Ambient subtle decorative curves */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#10B981]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#00201a]/40 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#A7F3D0]">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
              Patrimonio Consolidado
            </div>

            {/* Display large numeric balance */}
            <div className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-display tabular-nums">
              {formatCurrency(totalNetWorth, 'USD', privacyMode)}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs sm:text-sm text-[#A7F3D0]">
              <span className="inline-flex items-center gap-1 bg-[#ffffff]/10 backdrop-blur-sm px-2.5 py-1 rounded-full text-white font-medium">
                <ArrowUpRight size={14} className="text-[#10B981]" />
                +4.18% este mes
              </span>
              <span className="text-[#A7F3D0]/80">+$6,140.00 USD netos acumulados</span>
            </div>
          </div>

          {/* Quick Action Triggers */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5">
            <button
              onClick={() => onOpenAddTransaction('income')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#10B981] text-[#00201A] hover:bg-[#34D399] active:scale-[0.98] transition-all shadow-sm"
            >
              <ArrowDownRight size={16} />
              <span>Ingreso</span>
            </button>

            <button
              onClick={() => onOpenAddTransaction('expense')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 active:scale-[0.98] transition-all"
            >
              <ArrowUpRight size={16} />
              <span>Gasto</span>
            </button>

            <button
              onClick={onOpenTransfer}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 active:scale-[0.98] transition-all"
            >
              <ArrowLeftRight size={16} />
              <span>Transferir</span>
            </button>

            <button
              onClick={handleExportSummary}
              title="Descargar informe"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-white/5 hover:bg-white/10 text-[#A7F3D0] border border-white/10 transition-all"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Reporte</span>
            </button>
          </div>
        </div>

        {/* Metric highlights footer within the card */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10 text-xs sm:text-sm">
          <div>
            <div className="text-white/70 text-xs">Entradas (Mes)</div>
            <div className="text-white font-semibold text-base sm:text-lg tabular-nums mt-0.5">
              {formatCurrency(monthlyInflow, 'USD', privacyMode)}
            </div>
          </div>
          <div>
            <div className="text-white/70 text-xs">Salidas (Mes)</div>
            <div className="text-white font-semibold text-base sm:text-lg tabular-nums mt-0.5">
              {formatCurrency(monthlyOutflow, 'USD', privacyMode)}
            </div>
          </div>
          <div>
            <div className="text-white/70 text-xs">Tasa de Ahorro</div>
            <div className="text-[#A7F3D0] font-semibold text-base sm:text-lg tabular-nums mt-0.5 flex items-center gap-1">
              <Percent size={14} />
              {savingsRate}%
            </div>
          </div>
          <div>
            <div className="text-white/70 text-xs">Rendimiento Prom.</div>
            <div className="text-[#A7F3D0] font-semibold text-base sm:text-lg tabular-nums mt-0.5 flex items-center gap-1">
              <Sparkles size={14} />
              +8.40% APY
            </div>
          </div>
        </div>
      </section>

      {/* 2. Intelligent Assistant Hub: Microphone Voice Option & AI Chat Option */}
      <section className="bg-white rounded-2xl p-5 sm:p-6 border border-[#0F172A]/8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0D5C4D]/10 text-[#0D5C4D] flex items-center justify-center font-bold flex-shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0B1C30] font-display flex items-center gap-2">
                <span>Centro de Asistencia Financiera Inteligente</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#0D5C4D]">
                  IA en Vivo
                </span>
              </h2>
              <p className="text-xs text-[#64748B]">
                Elige cómo interactuar con tu patrimonio: dictando con el micrófono o conversando con el asesor de IA
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Opción 1: Hablar por Micrófono */}
          <div
            onClick={() => onNavigateToTab('voice')}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-[#10B981]/30 hover:border-[#0D5C4D] bg-gradient-to-br from-[#F0FDF4] via-white to-white p-5 sm:p-6 transition-all hover:shadow-md active:scale-[0.99] flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0D5C4D] to-[#10B981] text-white flex items-center justify-center shadow-md shadow-[#0D5C4D]/20 group-hover:scale-105 transition-transform">
                  <Mic size={24} className="animate-pulse" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#10B981]/15 text-[#065F46] border border-[#10B981]/20 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping"></span>
                  Opción Micrófono
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#0B1C30] group-hover:text-[#0D5C4D] transition-colors flex items-center gap-2">
                  <span>Hablar con el Asistente por Voz</span>
                  <ChevronRight size={16} className="text-[#94A3B8] group-hover:text-[#0D5C4D] group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  Usa el icono del micrófono para registrar gastos, abonos o transferencias directamente hablando con tu voz, o consultar tu saldo al instante.
                </p>
              </div>

              {/* Sample voice phrases */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] font-medium bg-white px-2.5 py-1 rounded-lg border border-[#0F172A]/8 text-[#0D5C4D] shadow-2xs">
                  "Gasto de $45 en almuerzo"
                </span>
                <span className="text-[10px] font-medium bg-white px-2.5 py-1 rounded-lg border border-[#0F172A]/8 text-[#0D5C4D] shadow-2xs">
                  "¿Cuál es mi patrimonio total?"
                </span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[#10B981]/20 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#0D5C4D] flex items-center gap-1.5">
                <Mic size={14} />
                <span>Control por voz activo</span>
              </span>
              <button
                type="button"
                className="px-4 py-2 bg-[#0D5C4D] text-white rounded-xl text-xs font-semibold group-hover:bg-[#094539] transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Mic size={13} />
                <span>Hablar ahora</span>
              </button>
            </div>
          </div>

          {/* Opción 2: Chat de IA */}
          <div
            onClick={() => onNavigateToTab('chat')}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-slate-200 hover:border-[#0D5C4D] bg-gradient-to-br from-[#F8FAFC] via-white to-white p-5 sm:p-6 transition-all hover:shadow-md active:scale-[0.99] flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0B1C30] to-[#1E293B] text-white flex items-center justify-center shadow-md shadow-[#0B1C30]/20 group-hover:scale-105 transition-transform">
                  <Sparkles size={24} className="text-[#A7F3D0]" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#0D5C4D]/10 text-[#0D5C4D] border border-[#0D5C4D]/15 flex items-center gap-1.5">
                  <Bot size={13} />
                  Opción Chat IA
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#0B1C30] group-hover:text-[#0D5C4D] transition-colors flex items-center gap-2">
                  <span>Chat con Asesor Financiero IA</span>
                  <ChevronRight size={16} className="text-[#94A3B8] group-hover:text-[#0D5C4D] group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  Interactúa por texto con el estratega de Gemini 3.8 Flash para auditorías de presupuesto, análisis de carteras y proyecciones de interés compuesto.
                </p>
              </div>

              {/* Sample chat prompts */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] font-medium bg-white px-2.5 py-1 rounded-lg border border-[#0F172A]/8 text-[#0B1C30] shadow-2xs">
                  "Audita mis presupuestos este mes"
                </span>
                <span className="text-[10px] font-medium bg-white px-2.5 py-1 rounded-lg border border-[#0F172A]/8 text-[#0B1C30] shadow-2xs">
                  "Estrategia para fondo de emergencia"
                </span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[#0F172A]/10 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#0B1C30] flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#0D5C4D]" />
                <span>Chat conversacional</span>
              </span>
              <button
                type="button"
                className="px-4 py-2 bg-[#0B1C30] text-white rounded-xl text-xs font-semibold group-hover:bg-[#0D5C4D] transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Sparkles size={13} className="text-[#A7F3D0]" />
                <span>Abrir Chat</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive Asset Growth Chart & Time Horizon */}
      <section className="bg-white rounded-2xl p-5 sm:p-6 border border-[#0F172A]/8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-[#0B1C30] font-display flex items-center gap-2">
              <span>Evolución del Balance</span>
              <span className="text-xs font-medium text-[#10B981] bg-[#10B981]/10 px-2.5 py-0.5 rounded-full">
                Auditado
              </span>
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Trayectoria histórica consolidando bóvedas e ingresos netos
            </p>
          </div>

          {/* Timeframe selector pill buttons */}
          <div className="inline-flex items-center p-1 bg-[#F1F5F9] rounded-xl border border-[#0F172A]/5">
            {(['1S', '1M', '3M', '1A', 'TODO'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  timeRange === range
                    ? 'bg-white text-[#0D5C4D] shadow-sm'
                    : 'text-[#64748B] hover:text-[#0B1C30]'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Recharts Area Container */}
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                stroke="#94A3B8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94A3B8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                domain={['auto', 'auto']}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#0B1C30] text-white p-3 rounded-xl shadow-xl text-xs border border-white/10 space-y-1">
                        <div className="text-white/60 font-medium">{data.date}</div>
                        <div className="text-sm font-bold text-[#A7F3D0] tabular-nums">
                          {privacyMode ? '••••••••' : `$${data.balance.toLocaleString()} USD`}
                        </div>
                        {data.inflow > 0 && (
                          <div className="text-[#10B981]">
                            +${data.inflow.toLocaleString()} entrada
                          </div>
                        )}
                        {data.outflow > 0 && (
                          <div className="text-[#EF4444]">
                            -${data.outflow.toLocaleString()} salida
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#0D5C4D"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#balanceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 3. Account Bóvedas Strip & Quick Overview */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-[#0B1C30] font-display flex items-center gap-2">
            <Layers size={18} className="text-[#0D5C4D]" />
            <span>Bóvedas &amp; Cuentas Activas</span>
          </h2>
          <button
            onClick={() => onNavigateToTab('accounts')}
            className="text-xs font-semibold text-[#0D5C4D] hover:underline inline-flex items-center gap-1"
          >
            <span>Administrar todas</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {accounts.map((account) => (
            <div
              key={account.id}
              onClick={() => onNavigateToTab('accounts')}
              className="group bg-white p-4 rounded-xl border border-[#0F172A]/8 hover:border-[#0D5C4D]/30 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: account.color }}
              />
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    {account.type === 'checking'
                      ? 'Operativa'
                      : account.type === 'investment'
                      ? 'Inversión'
                      : 'Ahorro Alto'}
                  </span>
                  <h3 className="text-sm font-semibold text-[#0B1C30] truncate max-w-[170px] mt-0.5">
                    {account.name}
                  </h3>
                  <div className="text-xs text-[#94A3B8] font-mono mt-0.5">
                    {account.accountNumberMasked}
                  </div>
                </div>
                {account.apy && (
                  <span className="text-[11px] font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full">
                    {account.apy}% APY
                  </span>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[#0F172A]/5 flex items-baseline justify-between">
                <span className="text-base sm:text-lg font-bold text-[#0B1C30] tabular-nums font-display">
                  {formatCurrency(account.balance, account.currency, privacyMode)}
                </span>
                <span className="text-xs text-[#64748B] group-hover:text-[#0D5C4D] transition-colors">
                  Detalles &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Two-Column Row: Budget Health Progress + Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Quick Budget Pulse (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-[#0F172A]/8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#0B1C30] font-display">
                  Salud Presupuestaria
                </h3>
                <p className="text-xs text-[#64748B]">Consumo mensual consolidado</p>
              </div>
              <button
                onClick={() => onNavigateToTab('budgets')}
                className="text-xs font-semibold text-[#0D5C4D] hover:underline"
              >
                Ajustar
              </button>
            </div>

            {/* Main Progress Indicator */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[#0B1C30]">
                  {formatCurrency(totalSpentInBudget, 'USD', privacyMode)} gastados
                </span>
                <span className="text-[#64748B]">
                  Límite: {formatCurrency(totalAllocatedBudget, 'USD', privacyMode)}
                </span>
              </div>

              {/* Linear track: Height 8px, track #E2E8F0, rounded-full */}
              <div className="h-2.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    budgetUsagePercent > 90
                      ? 'bg-[#EF4444]'
                      : budgetUsagePercent > 75
                      ? 'bg-[#F59E0B]'
                      : 'bg-[#10B981]'
                  }`}
                  style={{ width: `${budgetUsagePercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-0.5">
                <span>{budgetUsagePercent}% ejercido</span>
                <span
                  className={
                    budgetUsagePercent > 90
                      ? 'text-[#EF4444] font-medium'
                      : 'text-[#10B981] font-medium'
                  }
                >
                  {budgetUsagePercent > 90
                    ? 'Umbral crítico'
                    : budgetUsagePercent > 75
                    ? 'Precaución'
                    : 'Dentro del objetivo'}
                </span>
              </div>
            </div>

            {/* 3 Featured Budgets */}
            <div className="space-y-3.5">
              {budgets.slice(0, 3).map((b) => {
                const spent = transactions
                  .filter((t) => t.category === b.category && t.type === 'expense')
                  .reduce((sum, t) => sum + t.amount, 0);
                const percent = Math.min(100, Math.round((spent / b.allocatedAmount) * 100));

                let barColor = '#10B981';
                if (percent > 90) barColor = '#EF4444';
                else if (percent > 75) barColor = '#F59E0B';

                return (
                  <div key={b.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: b.color }}
                        />
                        <span className="font-medium text-[#0B1C30]">{b.label}</span>
                      </div>
                      <span className="text-[#64748B] tabular-nums">
                        {formatCurrency(spent, 'USD', privacyMode)} / {formatCurrency(b.allocatedAmount, 'USD', privacyMode)}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%`, backgroundColor: barColor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-5 mt-4 border-t border-[#0F172A]/5">
            <button
              onClick={() => onNavigateToTab('budgets')}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-[#0D5C4D] bg-[#0D5C4D]/8 hover:bg-[#0D5C4D]/15 transition-all text-center"
            >
              Ver Desglose Analítico Completo
            </button>
          </div>
        </div>

        {/* Right: Recent Transaction Activity (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-[#0F172A]/8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#0B1C30] font-display">
                Movimientos Recientes
              </h3>
              <p className="text-xs text-[#64748B]">Auditoría de cargos y abonos</p>
            </div>
            <button
              onClick={() => onNavigateToTab('transactions')}
              className="text-xs font-semibold text-[#0D5C4D] hover:underline inline-flex items-center gap-1"
            >
              <span>Ver historial</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="divide-y divide-[#0F172A]/5">
            {transactions.slice(0, 5).map((tx) => {
              const isIncome = tx.type === 'income';
              const isTransfer = tx.type === 'transfer';

              return (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className="py-3 sm:py-3.5 flex items-center justify-between gap-3 hover:bg-[#F8FAFC] -mx-2 px-2 rounded-xl transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Category circle icon (40px, tinted background matching category color) */}
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
                      <div className="text-xs sm:text-sm font-semibold text-[#0B1C30] truncate group-hover:text-[#0D5C4D] transition-colors">
                        {tx.title}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#64748B] mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {formatDateSpanish(tx.date)}
                        </span>
                        <span>&bull;</span>
                        <span className="truncate max-w-[120px]">{tx.merchant}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div
                      className={`text-xs sm:text-sm font-bold tabular-nums font-display ${
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
                    <span className="text-[10px] font-medium text-[#94A3B8] uppercase">
                      {tx.status === 'completed' ? 'Completado' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
