import React from 'react';
import { Mic, Sparkles, MessageSquare } from 'lucide-react';
import { AppTab } from '../types';

interface FloatingAssistantDockProps {
  activeTab: AppTab;
  onNavigateTab: (tab: AppTab) => void;
}

export const FloatingAssistantDock: React.FC<FloatingAssistantDockProps> = ({
  activeTab,
  onNavigateTab,
}) => {
  return (
    <aside
      aria-label="Acceso rápido a asistencia inteligente"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 p-1.5 bg-[#0B1C30]/95 backdrop-blur-md text-white rounded-full shadow-2xl border border-white/15"
    >
      {/* Voice Option */}
      <button
        onClick={() => onNavigateTab('voice')}
        title="Usar por comandos de voz"
        className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
          activeTab === 'voice'
            ? 'bg-[#10B981] text-[#00201A] shadow-md font-bold'
            : 'text-white hover:bg-white/10'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center ${
            activeTab === 'voice' ? 'bg-[#00201A]/20' : 'bg-[#10B981]/20 text-[#10B981]'
          }`}
        >
          <Mic size={12} />
        </div>
        <span>Hablar por Voz</span>
      </button>

      <div className="w-[1px] h-5 bg-white/15" />

      {/* AI Chat Option */}
      <button
        onClick={() => onNavigateTab('chat')}
        title="Abrir Chat de IA"
        className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
          activeTab === 'chat'
            ? 'bg-[#0D5C4D] text-white shadow-md border border-[#10B981]/50 font-bold'
            : 'text-white hover:bg-white/10'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center ${
            activeTab === 'chat' ? 'bg-white/20' : 'bg-[#0D5C4D] text-[#A7F3D0]'
          }`}
        >
          <Sparkles size={12} />
        </div>
        <span>Chat de IA</span>
      </button>
    </aside>
  );
};
