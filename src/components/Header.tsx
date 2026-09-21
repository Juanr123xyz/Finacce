import React from 'react';
import {
  Eye,
  EyeOff,
  Plus,
  ArrowLeftRight,
  ShieldCheck,
  TrendingUp,
  PieChart,
  ListOrdered,
  Landmark,
  Mic,
  Sparkles,
  UserCheck,
  Zap,
  Lock,
} from 'lucide-react';
import { Account, AppTab } from '../types';
import { formatCurrency } from '../utils/formatters';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  privacyMode: boolean;
  setPrivacyMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  totalNetWorth: number;
  accounts: Account[];
  selectedAccountId: string;
  setSelectedAccountId: (id: string) => void;
  onOpenAddTransaction: () => void;
  onOpenTransfer: () => void;
  onOpenTailscaleModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  privacyMode,
  setPrivacyMode,
  totalNetWorth,
  accounts,
  selectedAccountId,
  setSelectedAccountId,
  onOpenAddTransaction,
  onOpenTransfer,
  onOpenTailscaleModal,
}) => {
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#0F172A]/8 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex items-center justify-between h-18 gap-4">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3.5">
            <div className="relative flex-shrink-0">
              <img
                src="/app-icon.svg"
                alt="Finacce"
                className="w-10 h-10 rounded-xl shadow-sm ring-1 ring-black/5"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#10B981] border-2 border-white rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold tracking-tight text-[#0B1C30] font-display">
                  Finacce
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#0D5C4D] bg-[#0D5C4D]/10 px-2 py-0.5 rounded-full">
                  <ShieldCheck size={11} />
                  Multi-Agent
                </span>
              </div>
              <p className="text-xs text-[#64748B] hidden sm:block">
                Gestión Patrimonial &amp; Tesorería Personal
              </p>
            </div>
          </div>

          {/* Center: Account selector & quick net-worth display */}
          <div className="hidden lg:flex items-center gap-3 bg-[#F8FAFC] border border-[#0F172A]/8 px-3.5 py-1.5 rounded-xl">
            <div className="text-xs text-[#64748B] flex items-center gap-1.5 font-medium">
              <Landmark size={14} className="text-[#0D5C4D]" />
              <span>Vista:</span>
            </div>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#0B1C30] focus:outline-none cursor-pointer pr-1"
            >
              <option value="all">Patrimonio Global (Todas las Cuentas)</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.accountNumberMasked})
                </option>
              ))}
            </select>
            <div className="h-4 w-[1px] bg-[#CBD5E1]"></div>
            <div className="text-xs font-bold text-[#0D5C4D] tabular-nums">
              {formatCurrency(
                selectedAccount ? selectedAccount.balance : totalNetWorth,
                'USD',
                privacyMode
              )}
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Tailscale VPN Badge & Connectivity Modal Trigger */}
            <button
              onClick={onOpenTailscaleModal}
              title="Verificar IP privada y seguridad Tailscale"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#10B981]/10 text-[#065F46] border border-[#10B981]/30 hover:bg-[#10B981]/20 transition-all"
            >
              <Lock size={12} className="text-[#10B981]" />
              <span>Tailscale VPN</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping"></span>
            </button>

            {/* Quick Voice Assistant Trigger with Microphone Icon */}
            <button
              onClick={() => setActiveTab('voice')}
              title="Hablar por micrófono (Comandos de Voz)"
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                activeTab === 'voice'
                  ? 'bg-[#10B981] text-[#00201A] border-[#10B981] shadow-xs'
                  : 'bg-[#10B981]/10 text-[#0D5C4D] border-[#10B981]/30 hover:bg-[#10B981]/20'
              }`}
            >
              <Mic size={15} className={activeTab === 'voice' ? 'text-[#00201A]' : 'text-[#0D5C4D]'} />
              <span className="hidden sm:inline">Voz</span>
            </button>

            {/* Quick AI Chat Trigger */}
            <button
              onClick={() => setActiveTab('chat')}
              title="Abrir Chat de Inteligencia Artificial"
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                activeTab === 'chat'
                  ? 'bg-[#0D5C4D] text-white border-[#0D5C4D] shadow-xs'
                  : 'bg-[#0D5C4D]/5 text-[#0B1C30] border-[#0F172A]/10 hover:bg-[#0D5C4D]/10'
              }`}
            >
              <Sparkles size={15} className={activeTab === 'chat' ? 'text-[#A7F3D0]' : 'text-[#10B981]'} />
              <span className="hidden sm:inline">Chat IA</span>
            </button>

            {/* Privacy Discretion Toggle */}
            <button
              onClick={() => setPrivacyMode((prev) => !prev)}
              title={privacyMode ? 'Mostrar cifras' : 'Modo discreción (Ocultar cifras)'}
              className={`p-2 sm:p-2.5 rounded-lg border transition-all ${
                privacyMode
                  ? 'bg-[#0D5C4D]/10 border-[#0D5C4D]/30 text-[#0D5C4D]'
                  : 'bg-white border-[#0F172A]/10 text-[#64748B] hover:text-[#0B1C30] hover:bg-[#F8FAFC]'
              }`}
            >
              {privacyMode ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>

            {/* Quick transfer button */}
            <button
              onClick={onOpenTransfer}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#0D5C4D] bg-[#0D5C4D]/10 hover:bg-[#0D5C4D]/15 transition-all"
            >
              <ArrowLeftRight size={14} />
              <span>Transferir</span>
            </button>

            {/* Primary Action: New Transaction */}
            <button
              onClick={onOpenAddTransaction}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold text-white bg-[#0D5C4D] hover:bg-[#094539] active:scale-[0.98] transition-all shadow-sm shadow-[#0D5C4D]/20"
            >
              <Plus size={16} />
              <span className="hidden xs:inline">Registrar</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar border-t border-[#0F172A]/5">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-[#0D5C4D] text-white shadow-sm'
                : 'text-[#64748B] hover:text-[#0B1C30] hover:bg-[#F1F5F9]'
            }`}
          >
            <TrendingUp size={15} />
            <span>Resumen &amp; Portafolio</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'transactions'
                ? 'bg-[#0D5C4D] text-white shadow-sm'
                : 'text-[#64748B] hover:text-[#0B1C30] hover:bg-[#F1F5F9]'
            }`}
          >
            <ListOrdered size={15} />
            <span>Transacciones</span>
          </button>

          <button
            onClick={() => setActiveTab('budgets')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'budgets'
                ? 'bg-[#0D5C4D] text-white shadow-sm'
                : 'text-[#64748B] hover:text-[#0B1C30] hover:bg-[#F1F5F9]'
            }`}
          >
            <PieChart size={15} />
            <span>Presupuestos</span>
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'accounts'
                ? 'bg-[#0D5C4D] text-white shadow-sm'
                : 'text-[#64748B] hover:text-[#0B1C30] hover:bg-[#F1F5F9]'
            }`}
          >
            <Landmark size={15} />
            <span>Bóvedas &amp; Cuentas</span>
          </button>

          <button
            onClick={() => setActiveTab('secretary')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'secretary'
                ? 'bg-[#0D5C4D] text-white shadow-sm'
                : 'text-[#64748B] hover:text-[#0B1C30] hover:bg-[#F1F5F9]'
            }`}
          >
            <UserCheck size={15} />
            <span>Secretaria IA</span>
          </button>

          <button
            onClick={() => setActiveTab('webhooks')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'webhooks'
                ? 'bg-[#0D5C4D] text-white shadow-sm'
                : 'text-[#64748B] hover:text-[#0B1C30] hover:bg-[#F1F5F9]'
            }`}
          >
            <Zap size={15} className="text-amber-400" />
            <span>Webhooks Pagos</span>
          </button>

          <button
            onClick={() => setActiveTab('voice')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'voice'
                ? 'bg-[#0D5C4D] text-white shadow-sm'
                : 'text-[#64748B] hover:text-[#0B1C30] hover:bg-[#F1F5F9]'
            }`}
          >
            <Mic size={15} className={activeTab === 'voice' ? 'text-white' : 'text-[#0D5C4D]'} />
            <span>Comandos de Voz</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'chat'
                ? 'bg-[#0D5C4D] text-white shadow-sm'
                : 'text-[#64748B] hover:text-[#0B1C30] hover:bg-[#F1F5F9]'
            }`}
          >
            <Sparkles size={15} className={activeTab === 'chat' ? 'text-[#A7F3D0]' : 'text-[#10B981]'} />
            <span>Chat Multi-Agente</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
