import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Mail,
  Bell,
  Calendar,
  Sparkles,
  UserCheck,
  Tag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Inbox,
  Filter,
} from 'lucide-react';
import { Task, EmailNotification } from '../types';

interface SecretaryTabProps {
  tasks: Task[];
  emails: EmailNotification[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onMarkEmailRead: (emailId: string) => void;
  showToast: (msg: string) => void;
}

export const SecretaryTab: React.FC<SecretaryTabProps> = ({
  tasks,
  emails,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onMarkEmailRead,
  showToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'tasks' | 'emails'>('tasks');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  // Form states
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskCategory, setNewTaskCategory] = useState('general');

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  const unreadEmails = emails.filter((e) => !e.isRead);

  const displayedTasks = tasks.filter((t) => {
    if (filterPriority === 'all') return true;
    return t.priority === filterPriority;
  });

  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    onAddTask({
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim() || undefined,
      dueDate: newTaskDueDate || new Date().toISOString().split('T')[0],
      priority: newTaskPriority,
      category: newTaskCategory,
      completed: false,
      assignedTo: 'Secretary Agent',
    });

    setNewTaskTitle('');
    setNewTaskDesc('');
    setIsNewTaskOpen(false);
    showToast(`Tarea "${newTaskTitle}" agendada por la Secretaria`);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#040914] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-300 text-xs font-semibold backdrop-blur-sm">
              <UserCheck size={14} />
              <span>Agente Secretaria Ejecutiva &amp; Asistente Multi-Agente</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
              Gestión de Tareas, Avisos y Correos
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Supervisión de agenda, notificaciones inteligentes de bancos, recordatorios de compromisos
              y automatizaciones ejecutivas integradas con el orquestador backend.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-center">
              <span className="text-xs text-slate-300 block font-medium">Tareas Pendientes</span>
              <span className="text-xl font-bold text-white tabular-nums">{pendingTasks.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-center">
              <span className="text-xs text-slate-300 block font-medium">Correos Sin Leer</span>
              <span className="text-xl font-bold text-amber-300 tabular-nums">{unreadEmails.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-[#0F172A]/8 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveSubTab('tasks')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${
              activeSubTab === 'tasks'
                ? 'bg-[#0B1C30] text-white shadow-md'
                : 'bg-white text-[#64748B] hover:text-[#0B1C30] border border-[#0F172A]/8'
            }`}
          >
            <CheckSquare size={16} />
            <span>Lista de Tareas &amp; Agenda ({tasks.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('emails')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${
              activeSubTab === 'emails'
                ? 'bg-[#0B1C30] text-white shadow-md'
                : 'bg-white text-[#64748B] hover:text-[#0B1C30] border border-[#0F172A]/8'
            }`}
          >
            <Mail size={16} />
            <span>Avisos &amp; Correos Bancarios ({emails.length})</span>
            {unreadEmails.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            )}
          </button>
        </div>

        {activeSubTab === 'tasks' && (
          <button
            onClick={() => setIsNewTaskOpen(true)}
            className="px-4 py-2.5 bg-[#0D5C4D] hover:bg-[#094539] text-white rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-sm"
          >
            <Plus size={16} />
            <span>Nueva Tarea</span>
          </button>
        )}
      </div>

      {/* Modal for adding a task */}
      {isNewTaskOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-[#0F172A]/10 space-y-5">
            <div className="flex items-center justify-between border-b border-[#0F172A]/8 pb-4">
              <h3 className="text-lg font-bold text-[#0B1C30] flex items-center gap-2">
                <Sparkles size={18} className="text-[#0D5C4D]" />
                <span>Agendar Tarea con Secretaria IA</span>
              </h3>
              <button
                onClick={() => setIsNewTaskOpen(false)}
                className="text-[#94A3B8] hover:text-[#0B1C30] font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0B1C30] mb-1">Título de la Tarea</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Revisar deducciones fiscales del trimestre..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#0B1C30] focus:ring-2 focus:ring-[#0D5C4D] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B1C30] mb-1">Descripción (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Detalles o notas adicionales para la Secretaria..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-4 py-2 text-xs sm:text-sm text-[#0B1C30] focus:ring-2 focus:ring-[#0D5C4D] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0B1C30] mb-1">Prioridad</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-semibold text-[#0B1C30] outline-none"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta / Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B1C30] mb-1">Fecha Límite</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#0B1C30] outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewTaskOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0B1C30]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0D5C4D] hover:bg-[#094539] text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  Guardar Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-Tab 1: Tasks Feed */}
      {activeSubTab === 'tasks' && (
        <div className="space-y-6">
          {/* Priority filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#64748B] font-semibold flex items-center gap-1">
              <Filter size={13} />
              <span>Filtrar por prioridad:</span>
            </span>
            {['all', 'high', 'medium', 'low'].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-3 py-1 rounded-lg font-semibold uppercase tracking-wider text-[10px] transition-all ${
                  filterPriority === p
                    ? 'bg-[#0B1C30] text-white'
                    : 'bg-white text-[#64748B] border border-[#0F172A]/8 hover:bg-[#F8FAFC]'
                }`}
              >
                {p === 'all' ? 'Todas' : p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : 'Baja'}
              </button>
            ))}
          </div>

          {/* Task list */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0F172A]/8 shadow-sm space-y-4">
            {displayedTasks.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#94A3B8]">
                No hay tareas en esta categoría. Agrega una arriba o mediante comando de voz ("Recordar pagar seguro").
              </div>
            ) : (
              <div className="divide-y divide-[#0F172A]/6">
                {displayedTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`py-4 flex items-start justify-between gap-4 transition-all group ${
                      task.completed ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <button
                        onClick={() => onToggleTask(task.id)}
                        className="mt-0.5 text-[#0D5C4D] hover:scale-110 transition-transform"
                      >
                        {task.completed ? (
                          <CheckSquare size={20} className="text-[#10B981]" />
                        ) : (
                          <Square size={20} className="text-[#94A3B8]" />
                        )}
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-sm font-semibold ${
                              task.completed ? 'line-through text-[#64748B]' : 'text-[#0B1C30]'
                            }`}
                          >
                            {task.title}
                          </h4>
                          <span
                            className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                              task.priority === 'high'
                                ? 'bg-red-100 text-red-700'
                                : task.priority === 'medium'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {task.priority === 'high' ? 'Urgente' : task.priority}
                          </span>
                        </div>

                        {task.description && (
                          <p className="text-xs text-[#64748B] leading-relaxed">{task.description}</p>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-[#94A3B8] pt-1">
                          {task.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              <span>Vence: {task.dueDate}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <UserCheck size={12} />
                            <span>{task.assignedTo}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 text-[#94A3B8] hover:text-[#EF4444] transition-all p-1.5 rounded-lg hover:bg-red-50"
                      title="Eliminar tarea"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Emails & Bank Alerts */}
      {activeSubTab === 'emails' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0F172A]/8 shadow-sm space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#0B1C30] flex items-center gap-2">
              <Inbox size={18} className="text-[#0D5C4D]" />
              <span>Buzón de Correos &amp; Notificaciones Bancarias</span>
            </h3>
            <span className="text-xs text-[#64748B]">Procesado en tiempo real por el orquestador</span>
          </div>

          <div className="space-y-3">
            {emails.map((email) => (
              <div
                key={email.id}
                onClick={() => onMarkEmailRead(email.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  email.isRead
                    ? 'bg-[#F8FAFC] border-[#0F172A]/6'
                    : 'bg-amber-50/50 border-amber-200/80 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0B1C30]">{email.sender}</span>
                      <span
                        className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                          email.category === 'bank_alert'
                            ? 'bg-red-100 text-red-700'
                            : email.category === 'reminder'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {email.category}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-semibold text-[#0B1C30]">{email.subject}</h4>
                    <p className="text-xs text-[#475569] leading-relaxed">{email.body}</p>

                    {email.actionTaken && (
                      <div className="mt-2 text-[11px] font-semibold text-[#0D5C4D] bg-[#0D5C4D]/10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg">
                        <CheckCircle2 size={12} />
                        <span>Acción Automática: {email.actionTaken}</span>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-[#94A3B8] whitespace-nowrap">{email.receivedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
