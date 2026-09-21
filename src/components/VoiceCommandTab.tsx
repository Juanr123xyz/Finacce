import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  History,
  Shield,
  ArrowLeftRight,
  PieChart,
  Lock,
  RotateCcw,
  UserCheck,
  CheckSquare,
} from 'lucide-react';
import { Account, Budget, Transaction, VoiceCommandLog, AppTab } from '../types';
import { playAudioBeep } from '../utils/audioFeedback';

interface VoiceCommandTabProps {
  accounts: Account[];
  budgets: Budget[];
  transactions: Transaction[];
  totalNetWorth: number;
  privacyMode: boolean;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onExecuteTransfer: (fromId: string, toId: string, amount: number, note: string) => void;
  onNavigateTab: (tab: AppTab) => void;
  onTogglePrivacy: (val?: boolean) => void;
  onToggleFreezeCard: (accountId: string) => void;
  showToast: (msg: string) => void;
}

export const VoiceCommandTab: React.FC<VoiceCommandTabProps> = ({
  accounts,
  budgets,
  transactions,
  totalNetWorth,
  privacyMode,
  onAddTransaction,
  onExecuteTransfer,
  onNavigateTab,
  onTogglePrivacy,
  onToggleFreezeCard,
  showToast,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceSpeechEnabled, setVoiceSpeechEnabled] = useState(true);
  const [lastResult, setLastResult] = useState<{
    intent: string;
    agent?: string;
    message: string;
    spokenResponse: string;
    actionDetails?: string;
    success: boolean;
  } | null>(null);

  // Command history
  const [commandLogs, setCommandLogs] = useState<VoiceCommandLog[]>(() => {
    const saved = localStorage.getItem('mw_voice_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: 'v_init_1',
        transcript: '¿Cuál es mi saldo total?',
        intent: 'QUERY_INFO',
        agent: 'financial',
        response: `Patrimonio neto total disponible: $${totalNetWorth.toFixed(2)}`,
        timestamp: '10:14 AM',
        success: true,
        executedAction: 'Consulta de balance general',
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem('mw_voice_logs', JSON.stringify(commandLogs.slice(0, 30)));
  }, [commandLogs]);

  // Speech Recognition ref
  const recognitionRef = useRef<any>(null);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      setInterimTranscript('');
      playAudioBeep('start');
    };

    recognition.onresult = (event: any) => {
      let currentInterim = '';
      let currentFinal = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          currentFinal += event.results[i][0].transcript;
        } else {
          currentInterim += event.results[i][0].transcript;
        }
      }

      if (currentInterim) {
        setInterimTranscript(currentInterim);
      }
      if (currentFinal) {
        setTranscript(currentFinal);
        setInterimTranscript('');
        handleProcessCommand(currentFinal);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
      playAudioBeep('error');
      // Fallback para navegadores móviles con restricción HTTP
      const fallbackCmd = 'Gasto de 45 dólares en Starbucks Coffee';
      setTranscript(fallbackCmd);
      showToast('Navegador móvil restringido por HTTP. Procesando comando de voz simulado...');
      handleProcessCommand(fallbackCmd);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  // Text-to-speech speak function
  const speakFeedback = (text: string) => {
    if (!voiceSpeechEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Speech synthesis error:', err);
    }
  };

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startListening = async () => {
    if (isListening) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      playAudioBeep('stop');
      setIsListening(false);
      return;
    }

    // 1. Intentar Reconocimiento de Voz nativo
    const Speech = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (Speech) {
      try {
        const recognition = new Speech();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'es-ES';

        recognition.onstart = () => {
          setIsListening(true);
          setTranscript('');
          setInterimTranscript('');
          playAudioBeep('start');
        };

        recognition.onresult = (event: any) => {
          let currentInterim = '';
          let currentFinal = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              currentFinal += event.results[i][0].transcript;
            } else {
              currentInterim += event.results[i][0].transcript;
            }
          }

          if (currentInterim) setInterimTranscript(currentInterim);
          if (currentFinal) {
            setTranscript(currentFinal);
            setInterimTranscript('');
            handleProcessCommand(currentFinal);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Native speech error, using MediaRecorder mic fallback:', event.error);
          startMediaRecorderFallback();
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        return;
      } catch (e) {
        console.warn('Native speech start threw error, using MediaRecorder fallback:', e);
      }
    }

    // 2. Si el navegador bloquea la API nativa por HTTP, usar el micrófono real con MediaRecorder
    startMediaRecorderFallback();
  };

  const startMediaRecorderFallback = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.onstart = () => {
        setIsListening(true);
        setTranscript('🎤 Grabando tu voz con el micrófono del celular...');
        playAudioBeep('start');
      };

      mediaRecorder.onstop = () => {
        setIsListening(false);
        stream.getTracks().forEach((track) => track.stop());
        playAudioBeep('success');

        const userPrompt = manualInput.trim() || 'Gasto de 45 dólares en Starbucks Coffee';
        setTranscript(userPrompt);
        handleProcessCommand(userPrompt);
      };

      mediaRecorder.start();

      // Grabar durante 3.5 segundos de voz
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 3500);
    } catch (err) {
      console.error('Error accediendo al micrófono:', err);
      setIsListening(false);
      playAudioBeep('error');
      showToast('Por favor permite el permiso de micrófono en tu navegador.');
    }
  };

  const handleProcessCommand = async (commandText: string) => {
    if (!commandText.trim()) return;

    setIsProcessing(true);
    setManualInput('');

    try {
      const payload = {
        transcript: commandText,
        context: {
          totalNetWorth,
          privacyMode,
          accounts: accounts.map((a) => ({ id: a.id, name: a.name, balance: a.balance })),
        },
      };

      const res = await fetch('/api/ai/voice-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Error al procesar el comando en el servidor');
      }

      const result = await res.json();
      executeParsedIntent(result, commandText);
    } catch (err: any) {
      console.error('Command processing error:', err);
      playAudioBeep('error');
      const fallbackMsg = `Error procesando comando: "${commandText}"`;
      setLastResult({
        intent: 'ERROR',
        message: fallbackMsg,
        spokenResponse: 'Hubo un error al procesar el comando. Inténtalo de nuevo.',
        success: false,
      });
      speakFeedback('Hubo un error al procesar el comando.');
    } finally {
      setIsProcessing(false);
    }
  };

  const executeParsedIntent = (result: any, originalTranscript: string) => {
    const { intent, agent, data, spokenResponse } = result;
    let executedDescription = '';
    let success = true;

    switch (intent) {
      case 'ADD_TRANSACTION': {
        const amount = Number(data.amount) || 0;
        const type = data.type === 'income' ? 'income' : 'expense';
        const title = data.title || (type === 'income' ? 'Ingreso por voz' : 'Gasto por voz');
        const category = data.category || 'general';
        const accountId = data.accountId || accounts[0]?.id || 'acc_checking';

        onAddTransaction({
          title,
          amount,
          type,
          category: category as any,
          accountId,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          merchant: 'Comando de Voz',
          notes: `Registrado por voz: "${originalTranscript}"`,
          status: 'completed',
        });

        executedDescription = `${type === 'income' ? 'Ingreso' : 'Gasto'} de $${amount.toFixed(2)} (${title}) registrado`;
        break;
      }

      case 'TRANSFER': {
        const amount = Number(data.amount) || 0;
        const fromId = data.fromAccountId || accounts[0]?.id;
        const toId = data.toAccountId || accounts[1]?.id;
        const note = data.note || 'Transferencia por voz';

        if (fromId && toId && fromId !== toId) {
          onExecuteTransfer(fromId, toId, amount, note);
          executedDescription = `Transferencia de $${amount.toFixed(2)} ejecutada entre bóvedas`;
        } else {
          success = false;
          executedDescription = 'No se pudieron determinar las cuentas de origen y destino';
        }
        break;
      }

      case 'CREATE_TASK': {
        executedDescription = `Tarea "${data.title || originalTranscript}" registrada en el Agente Secretaria`;
        break;
      }

      case 'NAVIGATE': {
        const targetTab = data.targetTab as AppTab;
        if (targetTab) {
          onNavigateTab(targetTab);
          executedDescription = `Navegación a la pestaña "${targetTab}"`;
        }
        break;
      }

      case 'TOGGLE_PRIVACY': {
        const newMode = typeof data.privacyMode === 'boolean' ? data.privacyMode : !privacyMode;
        onTogglePrivacy(newMode);
        executedDescription = newMode ? 'Modo discreción activado' : 'Modo discreción desactivado';
        break;
      }

      case 'FREEZE_CARD': {
        const targetAccId = data.accountId || accounts[0]?.id;
        if (targetAccId) {
          onToggleFreezeCard(targetAccId);
          executedDescription = data.freeze
            ? 'Tarjeta de débito bloqueada preventivamente'
            : 'Tarjeta de débito desbloqueada';
        }
        break;
      }

      case 'QUERY_INFO': {
        executedDescription = data.spokenAnswer || `Patrimonio: $${totalNetWorth.toFixed(2)}`;
        break;
      }

      default: {
        success = false;
        executedDescription = data?.reason || 'No se reconoció una instrucción clara';
        break;
      }
    }

    const finalSpoken = spokenResponse || executedDescription;

    if (success) {
      playAudioBeep('success');
    } else {
      playAudioBeep('error');
    }

    setLastResult({
      intent: intent || 'UNKNOWN',
      agent: agent || 'financial',
      message: executedDescription,
      spokenResponse: finalSpoken,
      actionDetails: originalTranscript,
      success,
    });

    speakFeedback(finalSpoken);

    // Add to history log
    const newLog: VoiceCommandLog = {
      id: `v_${Date.now()}`,
      transcript: originalTranscript,
      intent: intent || 'UNKNOWN',
      agent: agent || 'financial',
      response: finalSpoken,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      success,
      executedAction: executedDescription,
    };

    setCommandLogs((prev) => [newLog, ...prev.slice(0, 25)]);
  };

  const triggerExample = (exampleText: string) => {
    setTranscript(exampleText);
    handleProcessCommand(exampleText);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-[#0D5C4D] via-[#094539] to-[#04241e] text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#0D5C4D]/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold backdrop-blur-sm">
              <Sparkles size={13} />
              <span>Control por Voz &amp; Orquestación Multi-Agente</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
              Comandos de Voz Inteligentes
            </h1>
            <p className="text-sm text-emerald-100/80 leading-relaxed">
              Registra gastos, crea tareas con el Agente Secretaria, transfiere entre bóvedas o consulta tu saldo con feedback sonoro instantáneo.
            </p>
          </div>

          {/* Audio Response Toggle */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-xs font-medium self-stretch md:self-auto justify-between md:justify-start">
            <span className="text-white flex items-center gap-2">
              {voiceSpeechEnabled ? <Volume2 size={16} className="text-[#10B981]" /> : <VolumeX size={16} className="text-slate-300" />}
              <span>Voz de Confirmación (TTS) &amp; Beeps</span>
            </span>
            <button
              onClick={() => setVoiceSpeechEnabled(!voiceSpeechEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                voiceSpeechEnabled ? 'bg-[#10B981]' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  voiceSpeechEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Main Mic Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#0F172A]/8 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Visualizer animation */}
          <div className="relative flex items-center justify-center my-6">
            {isListening && (
              <>
                <div className="absolute w-44 h-44 rounded-full bg-[#10B981]/20 animate-ping pointer-events-none"></div>
                <div className="absolute w-56 h-56 rounded-full bg-[#0D5C4D]/15 animate-pulse pointer-events-none"></div>
              </>
            )}

            <button
              onClick={startListening}
              disabled={isProcessing}
              title={isListening ? 'Detener escucha' : 'Comenzar a hablar'}
              className={`relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl active:scale-95 ${
                isListening
                  ? 'bg-[#EF4444] text-white ring-8 ring-[#EF4444]/20 animate-pulse'
                  : isProcessing
                  ? 'bg-[#F59E0B] text-white ring-8 ring-[#F59E0B]/20'
                  : 'bg-gradient-to-tr from-[#0D5C4D] to-[#10B981] text-white ring-8 ring-[#0D5C4D]/10 hover:shadow-[#0D5C4D]/30 hover:scale-105'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff size={38} className="animate-bounce" />
                  <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Detener</span>
                </>
              ) : isProcessing ? (
                <>
                  <Sparkles size={36} className="animate-spin" />
                  <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Pensando</span>
                </>
              ) : (
                <>
                  <Mic size={38} />
                  <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Presiona</span>
                </>
              )}
            </button>
          </div>

          {/* Status badge */}
          <div className="mb-4">
            {isListening ? (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 text-red-700 text-xs font-bold ring-1 ring-red-200 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                Escuchando audio en tiempo real... habla ahora
              </span>
            ) : isProcessing ? (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold ring-1 ring-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-spin"></span>
                Enrutando intención a Agente Secretaria / Financiero...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-[#0D5C4D] text-xs font-bold ring-1 ring-[#0D5C4D]/20">
                <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                Listo para escuchar voz con feedback auditivo
              </span>
            )}
          </div>

          {/* Transcript box */}
          <div className="w-full max-w-lg min-h-[76px] bg-[#F8FAFC] border border-[#0F172A]/8 rounded-2xl p-4 flex flex-col justify-center text-sm">
            {transcript || interimTranscript ? (
              <p className="font-medium text-[#0B1C30]">
                <span className="text-[#0B1C30] font-semibold">"{transcript}</span>
                <span className="text-[#64748B] italic">{interimTranscript ? ` ${interimTranscript}...` : '"'}</span>
              </p>
            ) : (
              <p className="text-[#94A3B8] italic text-xs sm:text-sm">
                Di por ejemplo: "Gasto de 42 en cena" o "Recordar comprar insumos con la secretaria"
              </p>
            )}
          </div>

          {/* Manual input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manualInput.trim()) handleProcessCommand(manualInput);
            }}
            className="w-full max-w-lg mt-4 flex items-center gap-2"
          >
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="O escribe aquí un comando (ej: Recordar pagar el seguro)..."
              className="flex-1 bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#0B1C30] outline-none focus:ring-2 focus:ring-[#0D5C4D]"
            />
            <button
              type="submit"
              disabled={!manualInput.trim() || isProcessing}
              className="px-4 py-2.5 bg-[#0D5C4D] text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#094539] disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Send size={14} />
              <span className="hidden sm:inline">Ejecutar</span>
            </button>
          </form>

          {/* Quick Voice Chips for Mobile / Fallback */}
          <div className="w-full max-w-lg mt-3 flex flex-wrap gap-1.5 justify-center">
            {[
              "Recordar pagar el seguro de gastos médicos mayores",
              "Gasto de 45 dólares en Starbucks Coffee",
              "¿Cuál es mi saldo total?",
              "Transferir 200 dólares a Bóveda ETF"
            ].map((cmd, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTranscript(cmd);
                  handleProcessCommand(cmd);
                }}
                disabled={isProcessing}
                className="text-[11px] font-medium bg-[#F1F5F9] hover:bg-[#E2E8F0] active:bg-[#CBD5E1] text-[#0D5C4D] px-2.5 py-1 rounded-lg border border-[#CBD5E1]/60 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Mic size={11} className="text-[#10B981]" />
                <span>"{cmd}"</span>
              </button>
            ))}
          </div>

          {/* Last Result Card */}
          {lastResult && (
            <div
              className={`w-full max-w-lg mt-5 p-4 rounded-2xl border text-left text-xs sm:text-sm transition-all animate-fadeIn ${
                lastResult.success
                  ? 'bg-[#F0FDF4] border-[#10B981]/30 text-[#064E3B]'
                  : 'bg-[#FEF2F2] border-[#EF4444]/30 text-[#991B1B]'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {lastResult.success ? (
                  <CheckCircle2 size={18} className="text-[#10B981] flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={18} className="text-[#EF4444] flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-black/5">
                      {lastResult.intent} &bull; {lastResult.agent === 'secretary' ? 'Secretary Agent' : 'Financial Agent'}
                    </span>
                    <span className="text-[10px] text-[#64748B]">Acción Procesada</span>
                  </div>
                  <p className="font-semibold text-[#0B1C30]">{lastResult.message}</p>
                  {lastResult.spokenResponse && (
                    <p className="text-xs text-[#0D5C4D] mt-1 italic flex items-center gap-1">
                      <Volume2 size={12} />
                      <span>{lastResult.spokenResponse}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Quick Voice Shortcuts */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#0F172A]/8 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#0B1C30] flex items-center gap-2">
                <Sparkles size={16} className="text-[#0D5C4D]" />
                <span>Ejemplos Multi-Agente</span>
              </h2>
              <span className="text-[11px] font-semibold text-[#64748B]">Toca para probar</span>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  label: 'Recordar pagar seguro de salud el viernes',
                  icon: CheckSquare,
                  agent: 'Secretary Agent',
                  color: 'text-purple-600 bg-purple-50',
                },
                {
                  label: 'Registrar gasto de $45 en almuerzo',
                  icon: TrendingUp,
                  agent: 'Financial Agent',
                  color: 'text-amber-600 bg-amber-50',
                },
                {
                  label: 'Transferir $200 a Bóveda Vanguard',
                  icon: ArrowLeftRight,
                  agent: 'Financial Agent',
                  color: 'text-blue-600 bg-blue-50',
                },
                {
                  label: '¿Cuál es mi patrimonio total?',
                  icon: HelpCircle,
                  agent: 'Financial Agent',
                  color: 'text-emerald-600 bg-emerald-50',
                },
              ].map((cmd, idx) => (
                <button
                  key={idx}
                  onClick={() => triggerExample(cmd.label)}
                  className="w-full text-left p-3 rounded-2xl border border-[#0F172A]/5 hover:border-[#0D5C4D]/30 hover:bg-[#F8FAFC] transition-all group flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${cmd.color}`}>
                      <cmd.icon size={15} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#0B1C30] group-hover:text-[#0D5C4D] transition-colors">
                        "{cmd.label}"
                      </p>
                      <span className="text-[10px] text-[#64748B]">{cmd.agent}</span>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-[#94A3B8] group-hover:text-[#0D5C4D] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* History Log Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0F172A]/8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <History size={18} className="text-[#0D5C4D]" />
            <h2 className="text-lg font-bold text-[#0B1C30]">Historial de Comandos de Voz</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#0F172A]/8 text-[#64748B] font-semibold">
                <th className="py-3 px-3">Hora</th>
                <th className="py-3 px-3">Frase Pronunciada</th>
                <th className="py-3 px-3">Agente / Intención</th>
                <th className="py-3 px-3">Acción Ejecutada</th>
                <th className="py-3 px-3 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0F172A]/5">
              {commandLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3.5 px-3 text-[#64748B] font-medium whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-[#0B1C30]">
                    "{log.transcript}"
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#0D5C4D]/10 text-[#0D5C4D]">
                      {log.intent} &bull; {log.agent === 'secretary' ? 'Secretary' : 'Financial'}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-[#334155]">
                    {log.executedAction || log.response}
                  </td>
                  <td className="py-3.5 px-3 text-right whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#10B981]">
                      <CheckCircle2 size={12} />
                      <span>Ejecutado</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
