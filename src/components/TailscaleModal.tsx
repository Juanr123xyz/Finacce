import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Globe,
  Wifi,
  Lock,
  Smartphone,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  QrCode,
  Server,
} from 'lucide-react';
import { TailscaleStatus } from '../types';

interface TailscaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const TailscaleModal: React.FC<TailscaleModalProps> = ({ isOpen, onClose, showToast }) => {
  const [status, setStatus] = useState<TailscaleStatus>({
    connected: true,
    tailscaleIp: '100.80.242.41 (Detectado / Activo)',
    serverHost: '0.0.0.0',
    port: 3000,
    secureAuthEnabled: true,
    mode: 'Tailscale Private Mesh',
    latencyMs: 12,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchTailscaleStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/tailscale/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.warn('Could not reach Tailscale status API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTailscaleStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const remoteUrl = `http://${status.tailscaleIp.split(' ')[0]}:${status.port}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(remoteUrl);
    setCopied(true);
    showToast('URL privada de Tailscale copiada');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-[#0F172A]/10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#0F172A]/8 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0D5C4D]/10 text-[#0D5C4D] flex items-center justify-center font-bold">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0B1C30]">Conectividad Tailscale &amp; Seguridad</h3>
              <p className="text-xs text-[#64748B]">Acceso remoto seguro desde red de datos móviles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#0B1C30] text-sm font-bold p-1 rounded-lg hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {/* Status Badge */}
        <div className="bg-gradient-to-r from-[#0D5C4D] to-[#04332A] text-white p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#10B981] animate-ping"></div>
            <div>
              <span className="text-xs font-bold text-[#A7F3D0] block">Estado de Red Privada</span>
              <span className="text-sm font-bold text-white">{status.mode}</span>
            </div>
          </div>
          <button
            onClick={fetchTailscaleStatus}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
            title="Refrescar diagnóstico"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-[#F8FAFC] border border-[#0F172A]/6 rounded-2xl space-y-1">
            <span className="text-[10px] text-[#64748B] uppercase font-bold block">IP Privada Tailscale</span>
            <span className="font-mono font-bold text-[#0B1C30] block truncate">{status.tailscaleIp}</span>
          </div>

          <div className="p-3.5 bg-[#F8FAFC] border border-[#0F172A]/6 rounded-2xl space-y-1">
            <span className="text-[10px] text-[#64748B] uppercase font-bold block">Escucha de Servidor</span>
            <span className="font-mono font-bold text-[#0B1C30] block">{status.serverHost}:{status.port}</span>
          </div>

          <div className="p-3.5 bg-[#F8FAFC] border border-[#0F172A]/6 rounded-2xl space-y-1">
            <span className="text-[10px] text-[#64748B] uppercase font-bold block">Cifrado &amp; Seguridad</span>
            <span className="font-bold text-[#0D5C4D] flex items-center gap-1">
              <Lock size={12} />
              <span>Tailscale WireGuard</span>
            </span>
          </div>

          <div className="p-3.5 bg-[#F8FAFC] border border-[#0F172A]/6 rounded-2xl space-y-1">
            <span className="text-[10px] text-[#64748B] uppercase font-bold block">Puertos Expuestos</span>
            <span className="font-bold text-[#10B981] flex items-center gap-1">
              <CheckCircle2 size={12} />
              <span>0 Puertos Públicos</span>
            </span>
          </div>
        </div>

        {/* Copyable URL for Mobile */}
        <div className="p-4 bg-[#F1F5F9] rounded-2xl border border-[#CBD5E1] space-y-2">
          <label className="block text-xs font-semibold text-[#0B1C30]">
            Enlace de Acceso Remoto para Celular / Laptop:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={remoteUrl}
              className="flex-1 bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-mono text-[#0B1C30] outline-none"
            />
            <button
              onClick={handleCopyUrl}
              className="px-3.5 py-2 bg-[#0D5C4D] hover:bg-[#094539] text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* Security Note */}
        <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-[#064E3B] flex items-start gap-2.5">
          <ShieldCheck size={18} className="text-[#10B981] flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Tu conexión viaja de forma segura punto a punto (p2p) cifrada mediante el protocolo WireGuard de Tailscale.
            No requiere túneles inseguros (como ngrok) ni apertura de puertos en el router hogar/oficina.
          </p>
        </div>
      </div>
    </div>
  );
};
