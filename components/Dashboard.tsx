
import React, { useState } from 'react';
import { Play, Pause, CheckCircle2, AlertCircle, Clock, ChevronRight, UserCheck, Zap, Box, RefreshCw, Shield, Terminal, Download, FileJson, FileCode, Layers, Cpu, Binary, Scissors } from 'lucide-react';
import { Flow, Task, ThemeMode, TaskStatus } from '../types';

interface DashboardProps {
  flow: Flow;
  onTaskUpdate: (id: string, updates: Partial<Task>) => void;
  theme: ThemeMode;
}

const Dashboard: React.FC<DashboardProps> = ({ flow, onTaskUpdate, theme }) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const selectedTask = flow.tasks.find(t => t.id === selectedTaskId);

  return (
    <div className="h-full flex flex-col overflow-hidden animate-in fade-in duration-500">
      <div className="shrink-0 p-8 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard icon={<Binary className="text-blue-500" />} label="Fractal Depth" value={`Lvl ${flow.telemetry.avgReasoningDepth}`} theme={theme} />
          <MetricCard icon={<Cpu className="text-emerald-500" />} label="Memory Bank" value={`${flow.telemetry.memoryBankSize} Nodes`} theme={theme} />
          <MetricCard icon={<Scissors className="text-amber-500" />} label="Efficiency (Pruned)" value={`${flow.telemetry.prunedTasksCount} Saved`} theme={theme} />
          <MetricCard icon={<Zap className="text-purple-500" />} label="Token Flux" value={`~${Math.round(flow.telemetry.totalTokensEstimate / 1000)}k`} theme={theme} />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden p-8 pt-0 gap-8">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h2 className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full" /> Morssel v2.2 Cluster
            </h2>
            <div className="px-4 py-1.5 rounded-full bg-blue-600/10 text-blue-500 text-[9px] font-black uppercase tracking-widest border border-blue-500/20">
              Depth-Limited Recursive Flow
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-4 space-y-3 custom-scrollbar">
            {flow.tasks.map(task => {
              const depth = task.depth || 0;
              const isSubtask = !!task.parentTaskId;
              
              return (
                <div 
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`p-5 rounded-[2rem] border cursor-pointer transition-all duration-300 group ${isSubtask ? 'ml-8 opacity-80' : ''} ${selectedTaskId === task.id ? 'border-blue-500 bg-blue-600/5' : (theme === 'dark' ? 'border-white/5 bg-white/[0.02]' : 'border-slate-200 bg-white shadow-sm')}`}
                  style={{ marginLeft: `${depth * 20}px` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusIcon status={task.status} />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">{task.id}</span>
                        <div className="flex items-center gap-2">
                           <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${depth > 2 ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>DEPTH {depth}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <h3 className="font-bold text-sm mt-2">{task.title}</h3>
                  <p className="text-[11px] opacity-40 line-clamp-1 mt-1">{task.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-[400px] shrink-0 flex flex-col overflow-hidden">
          <div className={`h-full rounded-[2.5rem] border flex flex-col transition-all duration-700 overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}>
            {selectedTask ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-8 pb-4 shrink-0 border-b border-white/5">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-500">Morssel Descriptor</span>
                       <span className="text-[8px] font-bold opacity-30">LEVEL {selectedTask.depth || 0} NODE</span>
                    </div>
                    <StatusIcon status={selectedTask.status} />
                  </div>
                  <h3 className="text-2xl font-black italic tracking-tighter mb-2">{selectedTask.title}</h3>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                  {selectedTask.status === 'pruned' ? (
                    <div className="p-6 rounded-[1.5rem] bg-amber-500/10 border border-amber-500/20 text-center space-y-4">
                      <Scissors className="mx-auto text-amber-500" size={32} />
                      <p className="text-xs font-bold leading-relaxed">
                        Morssel Judge has pruned this task. 
                        Context was already fulfilled by global memory.
                      </p>
                    </div>
                  ) : selectedTask.outputData ? (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                        <Terminal size={12} /> Payload Artifact
                      </h4>
                      <div className={`p-6 rounded-[1.5rem] text-[11px] font-mono whitespace-pre-wrap leading-relaxed border ${theme === 'dark' ? 'bg-black/40 text-blue-300 border-white/5' : 'bg-slate-50 text-slate-800 border-slate-200'}`}>
                        {selectedTask.outputData.result}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 opacity-40">
                      <RefreshCw className="animate-spin text-blue-500" size={32} />
                      <p className="text-[10px] font-black uppercase tracking-widest">Processing Node {selectedTask.id}...</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4 opacity-20">
                <Box size={24} />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Select Fractal Node to Inspect</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ icon, label, value, theme }: { icon: React.ReactNode, label: string, value: string, theme: ThemeMode }) => (
  <div className={`p-5 rounded-[2rem] border flex items-center gap-4 ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
    <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}>{icon}</div>
    <div className="min-w-0">
      <span className="block text-[9px] font-black uppercase tracking-widest opacity-40">{label}</span>
      <div className="text-xl font-black italic tracking-tighter leading-none">{value}</div>
    </div>
  </div>
);

const StatusIcon = ({ status }: { status: TaskStatus }) => {
  const configs = {
    backlog: { icon: <Clock size={14} />, color: 'text-slate-500 bg-slate-500/10' },
    todo: { icon: <Play size={14} />, color: 'text-blue-500 bg-blue-500/10' },
    in_progress: { icon: <RefreshCw size={14} className="animate-spin" />, color: 'text-cyan-500 bg-cyan-500/10' },
    waiting_approval: { icon: <Shield size={14} />, color: 'text-amber-500 bg-amber-500/10' },
    completed: { icon: <CheckCircle2 size={14} />, color: 'text-emerald-500 bg-emerald-500/10' },
    failed: { icon: <AlertCircle size={14} />, color: 'text-red-500 bg-red-500/10' },
    decomposing: { icon: <Layers size={14} className="animate-pulse text-indigo-500" />, color: 'text-indigo-500 bg-indigo-500/10' },
    pruned: { icon: <Scissors size={14} />, color: 'text-amber-400 bg-amber-400/10' }
  };
  const cfg = configs[status] || configs.backlog;
  return <div className={`p-2 rounded-xl ${cfg.color}`}>{cfg.icon}</div>;
};

export default Dashboard;
