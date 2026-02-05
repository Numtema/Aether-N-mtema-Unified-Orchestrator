
import React, { useState } from 'react';
import { Play, Pause, CheckCircle2, AlertCircle, Clock, ChevronRight, UserCheck, Zap, Box, RefreshCw, Shield, Terminal, Download, FileJson, FileCode, Layers, Cpu, Binary, Scissors, Lightbulb, Ban, ExternalLink, Globe, Search, ShieldCheck, History, GitMerge, Database, ShieldAlert, RotateCw, Save } from 'lucide-react';
import { Flow, Task, ThemeMode, TaskStatus, MedallionStage } from '../types';
import { StorageService } from '../services/storageService';

interface DashboardProps {
  flow: Flow;
  onTaskUpdate: (id: string, updates: Partial<Task>) => void;
  theme: ThemeMode;
}

const Dashboard: React.FC<DashboardProps> = ({ flow, onTaskUpdate, theme }) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const selectedTask = flow.tasks.find(t => t.id === selectedTaskId);

  const handleRelaunch = (taskId: string) => {
    onTaskUpdate(taskId, { 
      status: 'todo', 
      error: undefined, 
      auditFeedback: undefined,
      outputData: undefined 
    });
  };

  const handleManualSync = async () => {
    setSaving(true);
    await StorageService.saveFlow(flow);
    setSaving(false);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden animate-in fade-in duration-500">
      <div className="shrink-0 p-8 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard icon={<Binary className="text-blue-500" />} label="Hierarchy Depth" value={`Lvl ${flow.telemetry.avgReasoningDepth}`} theme={theme} />
          <MetricCard icon={<ShieldCheck className="text-emerald-500" />} label="Schema Integrity" value={`${flow.telemetry.integrityScore}%`} theme={theme} />
          <MetricCard icon={<Database className="text-amber-500" />} label="Medallion Nodes" value={`${flow.tasks.length} Active`} theme={theme} />
          <MetricCard icon={<Zap className="text-purple-500" />} label="Project Health" value={`${flow.telemetry.auditPassRate}%`} theme={theme} />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden p-8 pt-0 gap-8">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h2 className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full" /> Recursive Medallion Flow
            </h2>
            <div className="flex items-center gap-2">
                <button 
                  onClick={handleManualSync}
                  className={`p-2 rounded-xl transition-all ${saving ? 'opacity-50' : 'hover:bg-blue-500/10 text-blue-500'}`}
                  title="Manual Firestore Sync"
                >
                  <Save size={18} className={saving ? 'animate-pulse' : ''} />
                </button>
                <div className="px-4 py-1.5 rounded-full bg-blue-600/10 text-blue-500 text-[9px] font-black uppercase tracking-widest border border-blue-500/20">
                  Bronze / Silver / Gold Architecture
                </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-4 space-y-3 custom-scrollbar">
            {flow.tasks.map(task => {
              const depth = task.depth || 0;
              
              return (
                <div 
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`p-5 rounded-[2rem] border cursor-pointer transition-all duration-300 group ${selectedTaskId === task.id ? 'border-blue-500 bg-blue-600/5 shadow-2xl scale-[1.01]' : (theme === 'dark' ? 'border-white/5 bg-white/[0.02]' : 'border-slate-200 bg-white shadow-sm hover:border-blue-300')}`}
                  style={{ marginLeft: `${depth * 24}px` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusIcon status={task.status} />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">{task.id}</span>
                           <MedallionBadge stage={task.medallionStage} />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                           <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${depth > 2 ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>DEPTH {depth}</span>
                           <span className="text-[8px] font-mono opacity-30 truncate max-w-[150px]">{task.hierarchyPath}</span>
                        </div>
                      </div>
                    </div>
                    {task.retryCount && task.retryCount > 0 && <span className="text-[8px] font-black px-2 py-1 rounded-full bg-amber-500 text-black">RETRY {task.retryCount}</span>}
                  </div>
                  <h3 className="font-bold text-sm mt-3">{task.title}</h3>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-[450px] shrink-0 flex flex-col overflow-hidden">
          <div className={`h-full rounded-[2.5rem] border flex flex-col transition-all duration-700 overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}>
            {selectedTask ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-8 pb-4 shrink-0 border-b border-white/5 bg-gradient-to-br from-blue-600/5 to-transparent">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-500">Node Descriptor</span>
                       <span className="text-[8px] font-bold opacity-30 uppercase tracking-widest mt-1">Hierarchy Path: {selectedTask.hierarchyPath}</span>
                    </div>
                    <StatusIcon status={selectedTask.status} />
                  </div>
                  <h3 className="text-2xl font-black italic tracking-tighter mb-2 leading-tight">{selectedTask.title}</h3>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                  {/* Action Bar for Node Control */}
                  {['completed', 'failed', 'rejected'].includes(selectedTask.status) && (
                    <button 
                      onClick={() => handleRelaunch(selectedTask.id)}
                      className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                    >
                      <RotateCw size={14} /> Relaunch Fractal Node
                    </button>
                  )}

                  {/* Schema Sentinel Intelligence */}
                  {selectedTask.medallionStage !== 'BRONZE' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                       <div className="space-y-3">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
                             <ShieldCheck size={12} /> Schema Sentinel Guidelines
                          </h4>
                          <div className={`p-5 rounded-[1.5rem] space-y-3 ${theme === 'dark' ? 'bg-blue-600/5 border border-blue-500/10' : 'bg-blue-50 border border-blue-100'}`}>
                             {selectedTask.recommendations?.map((r, i) => (
                               <div key={i} className="flex gap-3 text-[11px] font-medium leading-relaxed opacity-80">
                                 <Lightbulb size={12} className="shrink-0 text-amber-500" /> {r}
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                  )}

                  {selectedTask.error && (
                    <div className="p-6 rounded-[2rem] bg-red-500/10 border border-red-500/20 space-y-3">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
                          <AlertCircle size={12} /> Critical Execution Error
                       </h4>
                       <p className="text-[11px] font-mono leading-relaxed text-red-400">
                         {selectedTask.error}
                       </p>
                    </div>
                  )}

                  {selectedTask.auditFeedback && (
                    <div className="p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 space-y-3">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                          <ShieldAlert size={12} /> Gold Audit Feedback
                       </h4>
                       <p className="text-[11px] font-medium leading-relaxed italic opacity-80">
                         "{selectedTask.auditFeedback}"
                       </p>
                    </div>
                  )}

                  {selectedTask.outputData ? (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                        <Terminal size={12} /> Medallion Output
                      </h4>
                      <div className={`p-6 rounded-[2rem] text-[11px] font-mono whitespace-pre-wrap leading-relaxed border ${theme === 'dark' ? 'bg-black/40 text-blue-300 border-white/5' : 'bg-slate-50 text-slate-800 border-slate-200'}`}>
                        {selectedTask.outputData.result}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 opacity-40">
                      <RefreshCw className={`animate-spin text-blue-500 ${selectedTask.status === 'integrating' || selectedTask.status === 'in_progress' ? '' : 'hidden'}`} size={32} />
                      <p className="text-[10px] font-black uppercase tracking-widest">
                        {selectedTask.status === 'todo' ? 'Awaiting Orchestrator' : `Processing ${selectedTask.medallionStage} Layer...`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4 opacity-20">
                <GitMerge size={24} />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Morssel Hierarchy Hub</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MedallionBadge = ({ stage }: { stage: MedallionStage }) => {
  const colors = {
    BRONZE: 'bg-amber-700/10 text-amber-700 border-amber-700/20',
    SILVER: 'bg-slate-400/10 text-slate-500 border-slate-400/20',
    GOLD: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
  };
  return (
    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${colors[stage]}`}>
      {stage}
    </span>
  );
};

const MetricCard = ({ icon, label, value, theme }: { icon: React.ReactNode, label: string, value: string, theme: ThemeMode }) => (
  <div className={`p-5 rounded-[2rem] border flex items-center gap-4 transition-all hover:scale-[1.02] ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
    <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}>{icon}</div>
    <div className="min-w-0">
      <span className="block text-[9px] font-black uppercase tracking-widest opacity-40">{label}</span>
      <div className="text-xl font-black italic tracking-tighter leading-none">{value}</div>
    </div>
  </div>
);

const StatusIcon = ({ status, size = 14 }: { status: TaskStatus, size?: number }) => {
  const configs = {
    backlog: { icon: <Clock size={size} />, color: 'text-slate-500 bg-slate-500/10' },
    todo: { icon: <Play size={size} />, color: 'text-blue-500 bg-blue-500/10' },
    in_progress: { icon: <RefreshCw size={size} className="animate-spin" />, color: 'text-cyan-500 bg-cyan-500/10' },
    waiting_approval: { icon: <Shield size={size} />, color: 'text-amber-500 bg-amber-500/10' },
    completed: { icon: <CheckCircle2 size={size} />, color: 'text-emerald-500 bg-emerald-500/10' },
    failed: { icon: <AlertCircle size={size} />, color: 'text-red-500 bg-red-500/10' },
    decomposing: { icon: <Layers size={size} className="animate-pulse text-indigo-500" />, color: 'text-indigo-500 bg-indigo-500/10' },
    pruned: { icon: <Scissors size={size} />, color: 'text-amber-400 bg-amber-400/10' },
    anticipating: { icon: <Search size={size} className="animate-bounce" />, color: 'text-blue-400 bg-blue-500/10' },
    auditing: { icon: <ShieldCheck size={size} className="animate-pulse" />, color: 'text-emerald-400 bg-emerald-500/10' },
    rejected: { icon: <History size={size} />, color: 'text-amber-500 bg-amber-500/20' },
    integrating: { icon: <GitMerge size={size} className="animate-spin" />, color: 'text-blue-500 bg-blue-500/10' }
  };
  const cfg = configs[status] || configs.backlog;
  return <div className={`p-2 rounded-xl ${cfg.color}`}>{cfg.icon}</div>;
};

export default Dashboard;
