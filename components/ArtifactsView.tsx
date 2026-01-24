
import React, { useState } from 'react';
import { FileText, Download, Search, FileCode, FileJson, Clock, CheckCircle2, Filter, ExternalLink } from 'lucide-react';
import { Flow, Task, ThemeMode } from '../types';

interface ArtifactsViewProps {
  flow: Flow;
  theme: ThemeMode;
}

const ArtifactsView: React.FC<ArtifactsViewProps> = ({ flow, theme }) => {
  const [search, setSearch] = useState('');
  
  const artifacts = flow.tasks.filter(t => t.status === 'completed' && t.outputData);

  const downloadArtifact = (task: Task) => {
    if (!task.outputData) return;
    const content = task.outputData.result;
    const ext = task.outputData.artifactType === 'code' ? 'txt' : task.outputData.artifactType || 'md';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${flow.name.replace(/\s+/g, '_')}_${task.title.replace(/\s+/g, '_')}.${ext}`;
    a.click();
  };

  const filteredArtifacts = artifacts.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    t.outputData?.result.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col p-12 space-y-10 animate-in fade-in slide-in-from-right-4 duration-700 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-black italic tracking-tighter uppercase flex items-center gap-4">
            <div className="p-4 bg-emerald-600 rounded-[1.5rem] shadow-2xl shadow-emerald-500/30 text-white">
              <FileText size={32} />
            </div>
            Project Artifacts
          </h2>
          <p className="text-xs opacity-50 font-bold uppercase tracking-[0.3em] ml-20">Browse and export generated deliverables for: {flow.name}</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Filter artifacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-12 pr-6 py-4 rounded-2xl border outline-none focus:ring-4 ring-blue-500/10 transition-all font-bold text-sm ${theme === 'dark' ? 'bg-slate-900 border-white/5 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-sm'}`}
            />
          </div>
          <button className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-white/5 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
        {filteredArtifacts.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-12">
            {filteredArtifacts.map(task => (
              <div 
                key={task.id}
                className={`p-8 rounded-[2.5rem] border group transition-all hover:scale-[1.01] ${theme === 'dark' ? 'bg-slate-900 border-white/5 hover:border-blue-500/30' : 'bg-white border-slate-200 shadow-xl hover:shadow-2xl'}`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}>
                      {task.outputData?.artifactType === 'code' ? <FileCode className="text-blue-500" /> : 
                       task.outputData?.artifactType === 'json' ? <FileJson className="text-amber-500" /> : 
                       <FileText className="text-emerald-500" />}
                    </div>
                    <div>
                      <h3 className="text-xl font-black italic tracking-tighter uppercase leading-none">{task.title}</h3>
                      <div className="flex items-center gap-3 mt-2 text-[10px] font-black uppercase tracking-widest opacity-40">
                         <Clock size={12} /> {new Date(task.outputData?.timestamp || 0).toLocaleTimeString()}
                         <span className="w-1 h-1 rounded-full bg-slate-500" />
                         <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 size={10} /> Verified</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => downloadArtifact(task)}
                    className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-90"
                    title="Download Artifact"
                  >
                    <Download size={18} />
                  </button>
                </div>

                <div className={`p-6 rounded-2xl text-xs font-mono line-clamp-6 leading-relaxed border ${theme === 'dark' ? 'bg-black/40 border-white/5 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  {task.outputData?.result}
                </div>
                
                <div className="mt-6 flex justify-between items-center pt-6 border-t border-white/5">
                   <span className="text-[9px] font-black uppercase tracking-widest opacity-30">Type: {task.outputData?.artifactType?.toUpperCase() || 'MARKDOWN'}</span>
                   <button className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:underline flex items-center gap-2">
                     Open Preview <ExternalLink size={12} />
                   </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-30 space-y-4">
            <FileText size={64} />
            <div>
              <h3 className="text-xl font-black uppercase tracking-widest">No Artifacts Found</h3>
              <p className="text-xs font-bold uppercase tracking-widest mt-2">Complete tasks to generate project deliverables</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtifactsView;
