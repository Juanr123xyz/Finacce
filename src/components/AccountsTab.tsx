import React, { useState } from 'react';
import {
  Landmark,
  CreditCard,
  TrendingUp,
  ShieldCheck,
  Lock,
  Unlock,
  ArrowLeftRight,
  Calculator,
  Percent,
  Sparkles,
  Layers,
  PiggyBank,
} from 'lucide-react';
import { Account, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';

interface AccountsTabProps {
  accounts: Account[];
  transactions: Transaction[];
  privacyMode: boolean;
  onOpenTransfer: () => void;
  onToggleFreezeCard: (accountId: string) => void;
}

export const AccountsTab: React.FC<AccountsTabProps> = ({
  accounts,
  transactions,
  privacyMode,
  onOpenTransfer,
  onToggleFreezeCard,
}) => {
  // Compound interest projection state
  const [calcMonths, setCalcMonths] = useState<number>(12);
  const [calcMonthlyAdd, setCalcMonthlyAdd] = useState<number>(500);

  const hysaAccount = accounts.find((a) => a.id === 'acc_high_yield') || accounts[0];
  const apyRate = (hysaAccount.apy || 4.85) / 100;
  const monthlyRate = apyRate / 12;

  // Calculate future value with compound interest
  const initialPrincipal = hysaAccount.balance;
  let projectedBalance = initialPrincipal;
  for (let i = 0; i < calcMonths; i++) {
    projectedBalance = (projectedBalance + calcMonthlyAdd) * (1 + monthlyRate);
  }
  const totalInterestEarned = projectedBalance - initialPrincipal - calcMonthlyAdd * calcMonths;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* 1. Header & Transfer Call to Action */}
      <div className="bg-white rounded-2xl p-6 border border-[#0F172A]/8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0B1C30] font-display">
            Bóvedas &amp; Cuentas Patrimoniales
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Estructura multi-entidad con custodia institucional y segregación de fondos
          </p>
        </div>

        <button
          onClick={onOpenTransfer}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#0D5C4D] hover:bg-[#094539] active:scale-[0.98] transition-all shadow-sm self-start sm:self-auto"
        >
          <ArrowLeftRight size={16} />
          <span>Transferir entre Bóvedas</span>
        </button>
      </div>

      {/* 2. Main Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts.map((account) => {
          const isChecking = account.type === 'checking';
          const isInvestment = account.type === 'investment';
          const isSavings = account.type === 'savings';

          return (
            <div
              key={account.id}
              className="bg-white rounded-2xl p-6 border border-[#0F172A]/8 shadow-sm hover:border-[#0D5C4D]/30 transition-all space-y-5"
            >
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: account.color }}
                  >
                    {isChecking ? (
                      <CreditCard size={22} />
                    ) : isInvestment ? (
                      <TrendingUp size={22} />
                    ) : (
                      <PiggyBank size={22} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0B1C30] font-display">
                      {account.name}
                    </h3>
                    <div className="text-xs text-[#64748B] flex items-center gap-2 mt-0.5">
                      <span>{account.institution}</span>
                      <span>&bull;</span>
                      <span className="font-mono">{account.accountNumberMasked}</span>
                    </div>
                  </div>
                </div>

                {account.apy && (
                  <span className="text-xs font-bold text-[#10B981] bg-[#10B981]/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Sparkles size={12} />
                    {account.apy}% APY
                  </span>
                )}
              </div>

              {/* Balance Amount */}
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#0F172A]/5 flex items-baseline justify-between">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Balance Disponible
                  </span>
                  <div className="text-2xl sm:text-3xl font-bold text-[#0B1C30] font-display tabular-nums mt-0.5">
                    {formatCurrency(account.balance, account.currency, privacyMode)}
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#0D5C4D] bg-[#0D5C4D]/8 px-2 py-1 rounded-md">
                  Auditado
                </span>
              </div>

              {/* Specific features for account type */}
              {isChecking && (
                <div className="space-y-3 pt-1">
                  {/* Virtual Debit Card Representation */}
                  <div
                    className={`relative p-5 rounded-2xl text-white overflow-hidden shadow-lg transition-all ${
                      account.cardFrozen
                        ? 'bg-gradient-to-br from-slate-700 to-slate-900 opacity-75'
                        : 'bg-gradient-to-br from-[#0D5C4D] to-[#062c24]'
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs opacity-80 mb-6">
                      <span>Apex Metal Reserve Card</span>
                      <span className="font-mono text-sm font-bold">VISA DEBIT</span>
                    </div>
                    {/* Chip representation */}
                    <div className="w-10 h-7 rounded bg-amber-300/80 mb-4 border border-amber-400"></div>
                    <div className="font-mono text-base tracking-widest mb-3">
                      4829 •••• •••• 9104
                    </div>
                    <div className="flex justify-between text-xs font-medium uppercase opacity-90">
                      <span>Juan E. Ramírez</span>
                      <span>EXP 08/29</span>
                    </div>
                  </div>

                  {/* Freeze / Unfreeze Toggle */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-[#64748B]">
                      Estado de la tarjeta:{' '}
                      <span className="font-bold text-[#0B1C30]">
                        {account.cardFrozen ? 'Bloqueada temporalmente' : 'Activa para pagos'}
                      </span>
                    </div>
                    <button
                      onClick={() => onToggleFreezeCard(account.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        account.cardFrozen
                          ? 'bg-[#10B981]/15 text-[#0D5C4D] hover:bg-[#10B981]/25'
                          : 'bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20'
                      }`}
                    >
                      {account.cardFrozen ? <Unlock size={13} /> : <Lock size={13} />}
                      <span>{account.cardFrozen ? 'Desbloquear' : 'Bloquear'}</span>
                    </button>
                  </div>
                </div>
              )}

              {isInvestment && (
                <div className="space-y-3 pt-1 text-xs">
                  <span className="font-semibold text-[#64748B] uppercase tracking-wider block">
                    Composición del Portafolio
                  </span>
                  <div className="space-y-2">
                    <div className="flex justify-between font-medium">
                      <span className="text-[#0B1C30]">Vanguard S&amp;P 500 ETF (VOO)</span>
                      <span className="font-bold text-[#0D5C4D]">60%</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-[#0B1C30]">FTSE All-World UCITS (VWCE)</span>
                      <span className="font-bold text-[#0D5C4D]">25%</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-[#0B1C30]">Bonos del Tesoro USA (TLT)</span>
                      <span className="font-bold text-[#0D5C4D]">15%</span>
                    </div>
                  </div>
                </div>
              )}

              {isSavings && (
                <div className="p-3 bg-[#E6F9F2] rounded-xl text-xs text-[#0D5C4D] space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <ShieldCheck size={14} />
                    Garantía FDIC asegurada hasta $250,000 USD
                  </div>
                  <p className="text-[#0D5C4D]/80 text-[11px]">
                    Liquidación diaria con disponibilidad 24/7 sin penalización de rescate.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Interactive Compound Interest Yield Simulator for HYSA */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#0F172A]/8 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 text-[#0D5C4D] flex items-center justify-center">
            <Calculator size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0B1C30] font-display">
              Simulador de Interés Compuesto HYSA
            </h2>
            <p className="text-xs text-[#64748B]">
              Proyección de crecimiento pasivo a una tasa fija garantizada de {hysaAccount.apy}% APY
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-center">
          {/* Controls: sliders */}
          <div className="lg:col-span-6 space-y-5">
            <div>
              <div className="flex justify-between text-xs font-semibold text-[#0B1C30] mb-2">
                <span>Plazo de reinversión:</span>
                <span className="text-[#0D5C4D] font-bold">{calcMonths} meses ({ (calcMonths / 12).toFixed(1) } años)</span>
              </div>
              <input
                type="range"
                min="6"
                max="60"
                step="6"
                value={calcMonths}
                onChange={(e) => setCalcMonths(Number(e.target.value))}
                className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0D5C4D]"
              />
              <div className="flex justify-between text-[11px] text-[#94A3B8] mt-1">
                <span>6m</span>
                <span>12m</span>
                <span>24m</span>
                <span>36m</span>
                <span>60m</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-[#0B1C30] mb-2">
                <span>Aporte mensual adicional:</span>
                <span className="text-[#0D5C4D] font-bold">${calcMonthlyAdd} USD</span>
              </div>
              <input
                type="range"
                min="0"
                max="3000"
                step="100"
                value={calcMonthlyAdd}
                onChange={(e) => setCalcMonthlyAdd(Number(e.target.value))}
                className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0D5C4D]"
              />
              <div className="flex justify-between text-[11px] text-[#94A3B8] mt-1">
                <span>$0</span>
                <span>$1,000</span>
                <span>$2,000</span>
                <span>$3,000</span>
              </div>
            </div>
          </div>

          {/* Results Display */}
          <div className="lg:col-span-6 bg-[#F8FAFC] p-5 sm:p-6 rounded-2xl border border-[#0F172A]/5 space-y-4">
            <div>
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Patrimonio Final Proyectado
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-[#0D5C4D] font-display tabular-nums mt-1">
                {formatCurrency(projectedBalance, 'USD', privacyMode)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#0F172A]/10 text-xs">
              <div>
                <span className="text-[#64748B]">Intereses generados:</span>
                <div className="text-base font-bold text-[#10B981] tabular-nums mt-0.5">
                  +{formatCurrency(totalInterestEarned, 'USD', privacyMode)}
                </div>
              </div>

              <div>
                <span className="text-[#64748B]">Aportes acumulados:</span>
                <div className="text-base font-bold text-[#0B1C30] tabular-nums mt-0.5">
                  {formatCurrency(calcMonthlyAdd * calcMonths, 'USD', privacyMode)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
