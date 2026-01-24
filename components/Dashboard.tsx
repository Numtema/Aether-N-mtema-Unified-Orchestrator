
import React, { useState } from 'react';
import { Play, Pause, CheckCircle2, AlertCircle, Clock, ChevronRight, UserCheck, Zap, Box, RefreshCw, Shield, Terminal, Download, FileJson, FileCode, Layers } from 'lucide-react';
import { Flow, Task, ThemeMode, TaskStatus } from '../types';

interface DashboardProps {
  flow: Flow;
  onTaskUpdate: (id: string, updates: Partial<Task>) => void;
  theme: ThemeMode;
}

const Dashboard: React.FC<DashboardProps> = ({ flow, onTaskUpdate, theme }) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const selectedTask = flow.tasks.find(t => t.id === selectedTaskId);

  const downloadArtifact = (task: Task) => {
    if (!task.outputData) return;
    const content = task.outputData.result;
    const ext = task.outputData.artifactType === 'code' ? 'txt' : task.outputData.artifactType || 'md';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Improved filename: Project_TaskTitle_ID.ext
    const safeProjectName = flow.name.replace(/\s+/g, '_');
    const safeTaskTitle = task.title.replace(/\s+/g, '_');
    a.download = `${safeProjectName}_${safeTaskTitle}_${task.id.replace(/\./g, '-')}.${ext}`;
    
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden animate-in fade-in duration-500">
      <div className="shrink-0 p-8 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard icon={<Zap className="text-blue-500" />} label="Status" value={flow.status.toUpperCase()} theme={theme} />
          <MetricCard icon={<CheckCircle2 className="text-emerald-500" />} label="Tasks" value={`${flow.tasks.filter(t => t.status === 'completed').length}/${flow.tasks.length}`} theme={theme} />
          <MetricCard icon={<Clock className="text-amber-500" />} label="Active" value={flow.tasks.filter(t => t.status === 'in_progress').length.toString()} theme={theme} />
          <MetricCard icon={<UserCheck className="text-purple-500" />} label="Success" value={`${Math.round((flow.tasks.filter(t => t.status === 'completed').length / (flow.tasks.length || 1)) * 100)}%`} theme={theme} />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden p-8 pt-0 gap-8">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h2 className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full" /> Orchestration Stack
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto pr-4 space-y-3 custom-scrollbar">
            {flow.tasks.map(task => {
              const isSubtask = task.parentTaskId;
              const isCompleted = task.status === 'completed';
              
              return (
                <div 
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`p-5 rounded-[2rem] border cursor-pointer transition-all duration-300 group ${isSubtask ? 'ml-8' : ''} ${selectedTaskId === task.id ? 'border-blue-500 bg-blue-600/5' : (theme === 'dark' ? 'border-white/5 bg-white/[0.02]' : 'border-slate-200 bg-white shadow-sm')}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusIcon status={task.status} />
                      <span className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">{task.id}</span>
                      {isSubtask && <div className="px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 text-[8px] font-black uppercase tracking-widest border border-slate-500/10">Subtask</div>}
                    </div>
                    {isCompleted && task.outputData && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); downloadArtifact(task); }}
                        className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-blue-500 transition-colors flex items-center gap-1"
                        title="Download Result"
                      >
                        <Download size={14} />
                        <span className="text-[9px] font-black uppercase tracking-tighter hidden group-hover:block">Save</span>
                      </button>
                    )}
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
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-500">Node Inspector</span>
                    <StatusIcon status={selectedTask.status} />
                  </div>
                  <h3 className="text-2xl font-black italic tracking-tighter mb-2">{selectedTask.title}</h3>
                  {selectedTask.parentTaskId && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
                      <Layers size={12} /> Part of {selectedTask.parentTaskId}
                    </div>
                  )}
                  {selectedTask.status === 'completed' && selectedTask.outputData && (
                    <button 
                      onClick={() => downloadArtifact(selectedTask)}
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors mb-2"
                    >
                      <Download size={14} /> Download Artefact
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                  {selectedTask.outputData ? (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                        <Terminal size={12} /> Execution Log
                      </h4>
                      <div className={`p-6 rounded-[1.5rem] text-[11px] font-mono whitespace-pre-wrap leading-relaxed border ${theme === 'dark' ? 'bg-black/40 text-blue-300 border-white/5' : 'bg-slate-50 text-slate-800 border-slate-200'}`}>
                        {selectedTask.outputData.result}
                      </div>
                    </div>
                  ) : selectedTask.status === 'in_progress' || selectedTask.status === 'decomposing' ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 opacity-40">
                      <Loader2 className="animate-spin text-blue-500" size={32} />
                      <p className="text-[10px] font-black uppercase tracking-widest">Generating Artifact...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 opacity-40">
                      <Box size={32} />
                      <p className="text-[10px] font-black uppercase tracking-widest">No artifact available for this status</p>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Node Metadata</h4>
                    <div className="grid grid-cols-1 gap-3">
                       <MetaItem label="Agent Assigned" value={selectedTask.assignedAgentId || 'Unassigned'} theme={theme} />
                       <MetaItem label="Recursive Depth" value={selectedTask.id.split('.').length.toString()} theme={theme} />
                       <MetaItem label="Type" value={selectedTask.parentTaskId ? 'Subtask Node' : 'Root Task Node'} theme={theme} />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4 opacity-20">
                <Box size={24} />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Select a node to inspect payload</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Internal components
const Loader2 = ({ size, className }: { size: number, className: string }) => (
  <RefreshCw size={size} className={className} />
);

const MetricCard = ({ icon, label, value, theme }: { icon: React.ReactNode, label: string, value: string, theme: ThemeMode }) => (
  <div className={`p-5 rounded-[2rem] border flex items-center gap-4 ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
    <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}>{icon}</div>
    <div className="min-w-0">
      <span className="block text-[9px] font-black uppercase tracking-widest opacity-40">{label}</span>
      <div className="text-xl font-black italic tracking-tighter leading-none">{value}</div>
    </div>
  </div>
);

const MetaItem = ({ label, value, theme }: { label: string, value: string, theme: ThemeMode }) => (
  <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
    <div className="text-[9px] font-black text-slate-500 uppercase mb-1">{label}</div>
    <div className="text-[11px] font-bold">{value}</div>
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
    decomposing: { icon: <Layers size={14} className="animate-pulse text-indigo-500" />, color: 'text-indigo-500 bg-indigo-500/10' }
  };
  const cfg = configs[status] || configs.backlog;
  return <div className={`p-2 rounded-xl ${cfg.color}`}>{cfg.icon}</div>;
};

export default Dashboard;
