import React, { useState } from 'react';
import {
  Zap,
  Smartphone,
  CheckCircle2,
  Copy,
  Check,
  Send,
  Radio,
  ArrowRight,
  ShieldCheck,
  Code,
  Terminal,
  RefreshCw,
  Clock,
  Sparkles,
  CreditCard,
} from 'lucide-react';
import { WebhookEvent } from '../types';

interface PaymentAutomationTabProps {
  webhookEvents: WebhookEvent[];
  onTriggerSimulatedWebhook: (payload: { merchant: string; amount: number; source: string }) => Promise<void>;
  showToast: (msg: string) => void;
}

export const PaymentAutomationTab: React.FC<PaymentAutomationTabProps> = ({
  webhookEvents,
  onTriggerSimulatedWebhook,
  showToast,
}) => {
  const [simMerchant, setSimMerchant] = useState('Uber Eats');
  const [simAmount, setSimAmount] = useState('32.50');
  const [simSource, setSimSource] = useState('AppleShortcuts_iOS');
  const [isSimulating, setIsSimulating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleSimulateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(simAmount);
    if (!simMerchant || isNaN(amountNum) || amountNum <= 0) {
      showToast('Por favor introduce un comercio y monto válido');
      return;
    }

    setIsSimulating(true);
    try {
      await onTriggerSimulatedWebhook({
        merchant: simMerchant,
        amount: amountNum,
        source: simSource,
      });
      showToast(`Webhook procesado: $${amountNum.toFixed(2)} en ${simMerchant}`);
    } catch (err) {
      showToast('Error al enviar webhook de prueba');
    } finally {
      setIsSimulating(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    showToast('Copiado al portapapeles');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const iosShortcutPayload = `{
  "source": "AppleShortcuts_iOS",
  "payload": "Notificación Banco: Compra por $45.00 en Starbucks",
  "amount": 45.00,
  "merchant": "Starbucks Coffee",
  "secretToken": "MW_ZERO_FRICTION_SECRET_2026"
}`;

  const androidTaskerPayload = `{
  "source": "Tasker_Android",
  "payload": "%evtprm2",
  "secretToken": "MW_ZERO_FRICTION_SECRET_2026"
}`;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-[#0284C7] via-[#0369A1] to-[#0C4A6E] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-sky-200 text-xs font-semibold backdrop-blur-sm">
              <Zap size={14} className="text-amber-300" />
              <span>Automatización Cero-Fricción (Zero-Friction Pipeline)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
              Captura Automática de Pagos via Webhook
            </h1>
            <p className="text-sm text-sky-100/90 leading-relaxed">
              Integra tus notificaciones de banco o SMS desde <strong>Apple Shortcuts (iOS)</strong> o{' '}
              <strong>Tasker / NotificationListener (Android)</strong> para registrar compras al instante en tu base de datos sin interacción manual.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/15 text-center self-stretch md:self-auto">
            <span className="text-xs text-sky-200 block font-medium">Eventos Procesados</span>
            <span className="text-2xl font-bold text-white tabular-nums">{webhookEvents.length}</span>
            <span className="text-[10px] text-emerald-300 block font-semibold mt-0.5">Zero Friction Active</span>
          </div>
        </div>
      </div>

      {/* Simulator Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Webhook Simulator */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-[#0F172A]/8 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-[#0F172A]/8 pb-4">
            <div>
              <h2 className="text-base font-bold text-[#0B1C30] flex items-center gap-2">
                <Radio size={18} className="text-[#0284C7]" />
                <span>Simulador de Webhook Bancario</span>
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Simula la recepción de una notificación de banco enviada desde un teléfono móvil.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-[#0D5C4D] text-[10px] font-bold">
              POST /api/webhooks/payment
            </span>
          </div>

          <form onSubmit={handleSimulateSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0B1C30] mb-1">Origen del Dispositivo</label>
              <select
                value={simSource}
                onChange={(e) => setSimSource(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#0B1C30] outline-none focus:ring-2 focus:ring-[#0284C7]"
              >
                <option value="AppleShortcuts_iOS">Apple Shortcuts (iOS Safari / Mobile)</option>
                <option value="Tasker_Android">Android Tasker / NotificationListener</option>
                <option value="AppShortcuts_RN">React Native / App Shortcut</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#0B1C30] mb-1">Nombre del Comercio</label>
                <input
                  type="text"
                  required
                  value={simMerchant}
                  onChange={(e) => setSimMerchant(e.target.value)}
                  placeholder="Ej: Mercado Libre, Uber, Starbucks..."
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#0B1C30] outline-none focus:ring-2 focus:ring-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B1C30] mb-1">Monto ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                  placeholder="45.00"
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#0B1C30] outline-none focus:ring-2 focus:ring-[#0284C7]"
                />
              </div>
            </div>

            <div className="bg-[#F8FAFC] p-3.5 rounded-2xl border border-[#0F172A]/6 text-xs space-y-1 font-mono text-[#334155]">
              <span className="text-[10px] text-[#64748B] font-sans font-bold block uppercase tracking-wider">
                Payload HTTP Simulado:
              </span>
              <p className="truncate">
                {`{"source":"${simSource}","merchant":"${simMerchant}","amount":${simAmount || 0}}`}
              </p>
            </div>

            <button
              type="submit"
              disabled={isSimulating}
              className="w-full py-3 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isSimulating ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Procesando cero fricción...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Disparar Webhook &amp; Registrar Transacción</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Setup Instructions for iOS & Android */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-[#0F172A]/8 shadow-sm space-y-5">
          <div className="border-b border-[#0F172A]/8 pb-4">
            <h2 className="text-base font-bold text-[#0B1C30] flex items-center gap-2">
              <Smartphone size={18} className="text-[#0D5C4D]" />
              <span>Configuración Móvil iOS / Android</span>
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Instrucciones para conectar notificaciones de tu teléfono celular vía Tailscale.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* iOS Shortcuts Card */}
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#0F172A]/8 space-y-2">
              <div className="flex items-center justify-between font-bold text-[#0B1C30]">
                <span className="flex items-center gap-1.5 text-sky-700">
                  <Smartphone size={14} />
                  <span>Apple Shortcuts (iOS)</span>
                </span>
                <button
                  onClick={() => copyToClipboard(iosShortcutPayload, 1)}
                  className="text-[11px] text-[#0284C7] hover:underline flex items-center gap-1 font-medium"
                >
                  {copiedIndex === 1 ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedIndex === 1 ? 'Copiado' : 'Copiar Payload JSON'}</span>
                </button>
              </div>
              <p className="text-[#64748B] leading-relaxed">
                1. Abre la app <strong>Shortcuts</strong> &gt; Automatización &gt; Nueva Automatización.
                <br />
                2. Selecciona "Cuando reciba una notificación de [App Banco]".
                <br />
                3. Agrega la acción <strong>"Obtener contenido de URL"</strong> a `http://100.x.y.z:3000/api/webhooks/payment` con método POST.
              </p>
            </div>

            {/* Android Tasker Card */}
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#0F172A]/8 space-y-2">
              <div className="flex items-center justify-between font-bold text-[#0B1C30]">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <Terminal size={14} />
                  <span>Android Tasker / NotificationListener</span>
                </span>
                <button
                  onClick={() => copyToClipboard(androidTaskerPayload, 2)}
                  className="text-[11px] text-[#0D5C4D] hover:underline flex items-center gap-1 font-medium"
                >
                  {copiedIndex === 2 ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedIndex === 2 ? 'Copiado' : 'Copiar Payload JSON'}</span>
                </button>
              </div>
              <p className="text-[#64748B] leading-relaxed">
                1. En Tasker, crea un perfil Evento &gt; Notificación de tu aplicación financiera.
                <br />
                2. Ejecuta una Tarea HTTP Post hacia la IP privada de Tailscale (`http://100.x.y.z:3000/api/webhooks/payment`).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Webhook Event Log Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0F172A]/8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#0F172A]/8 pb-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-[#0284C7]" />
            <h3 className="text-lg font-bold text-[#0B1C30]">Historial de Webhooks Recibidos</h3>
          </div>
          <span className="text-xs text-[#64748B]">Auditoría en tiempo real</span>
        </div>

        {webhookEvents.length === 0 ? (
          <div className="text-center py-10 text-xs text-[#94A3B8]">
            No hay eventos de webhook registrados aún. Ejecuta una prueba en el simulador arriba.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#0F172A]/8 text-[#64748B] font-semibold">
                  <th className="py-3 px-3">Fecha / Hora</th>
                  <th className="py-3 px-3">Origen</th>
                  <th className="py-3 px-3">Comercio Detectado</th>
                  <th className="py-3 px-3">Monto Extraído</th>
                  <th className="py-3 px-3 text-right">Estado Pipeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0F172A]/5">
                {webhookEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-3 text-[#64748B] font-medium whitespace-nowrap">
                      {evt.createdAt}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-[#0B1C30]">
                      <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-50 text-[#0284C7]">
                        {evt.source}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-[#0B1C30]">
                      {evt.parsedMerchant || 'Desconocido'}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-[#0D5C4D]">
                      ${Number(evt.parsedAmount || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#10B981] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 size={12} />
                        <span>Zero Friction Processed</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
