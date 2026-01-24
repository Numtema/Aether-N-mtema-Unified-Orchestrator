
import React, { useMemo } from 'react';
import { Flow, ThemeMode } from '../types';
import { Share2, Maximize2, Layers } from 'lucide-react';

interface GraphVisualizerProps {
  flow: Flow;
  theme: ThemeMode;
}

const GraphVisualizer: React.FC<GraphVisualizerProps> = ({ flow, theme }) => {
  return (
    <div className="h-full flex flex-col p-8 space-y-6 animate-in zoom-in duration-1000">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-3">
            <Share2 className="text-blue-500" /> Directed Acyclic Graph
          </h2>
          <p className="text-xs opacity-50 uppercase tracking-widest mt-1">Topology: {flow.workflowGraph.nodes.length} Nodes / {flow.workflowGraph.edges.length} Edges</p>
        </div>
        <div className="flex gap-2">
          <button className={`p-3 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
            <Maximize2 size={18} />
          </button>
          <button className={`p-3 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
            <Layers size={18} />
          </button>
        </div>
      </div>

      <div className={`flex-1 rounded-[3rem] border relative overflow-hidden flex items-center justify-center ${theme === 'dark' ? 'bg-slate-900/50 border-white/5 shadow-inner' : 'bg-white border-slate-200 shadow-2xl shadow-blue-500/5'}`}>
        
        {/* Animated Grid Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: `radial-gradient(${theme === 'dark' ? '#3b82f6' : '#1e3a8a'} 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />

        {/* Mocking the actual Graph Layout (SVG or Vis-Network simulation) */}
        <div className="relative w-full max-w-4xl h-full flex flex-col items-center justify-center gap-16">
          <GraphNode id="t1" label="Market Analysis" status="completed" theme={theme} />
          <div className="flex gap-32">
            <GraphNode id="t2" label="UX Design" status="in_progress" theme={theme} />
            <GraphNode id="t3" label="Engine Build" status="todo" theme={theme} />
          </div>
          <GraphNode id="t4" label="Deployment" status="todo" theme={theme} />
          
          {/* Simple SVG Arrows simulation */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.2))' }}>
            <line x1="50%" y1="20%" x2="50%" y2="80%" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" className="opacity-20" />
          </svg>
        </div>
      </div>
    </div>
  );
};

const GraphNode = ({ id, label, status, theme }: { id: string, label: string, status: string, theme: ThemeMode }) => (
  <div className={`
    p-6 rounded-3xl border-2 z-10 min-w-[200px] text-center transition-all duration-700
    ${status === 'completed' ? 'border-emerald-500/50 bg-emerald-500/10' : 
      status === 'in_progress' ? 'border-blue-500 bg-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.3)]' : 
      (theme === 'dark' ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-white')}
  `}>
    <div className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-1">{id}</div>
    <div className="text-sm font-bold">{label}</div>
    <div className={`mt-2 text-[8px] font-black uppercase tracking-widest ${status === 'completed' ? 'text-emerald-500' : status === 'in_progress' ? 'text-blue-500 animate-pulse' : 'text-slate-500'}`}>
      {status}
    </div>
  </div>
);

export default GraphVisualizer;
