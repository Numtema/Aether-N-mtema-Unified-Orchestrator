import React, { useMemo, useState } from 'react';
import { Flow, Task, ThemeMode, TaskStatus } from '../types';
import { 
  Share2, Maximize2, Layers, Cpu, Zap, 
  CheckCircle2, AlertCircle, Clock, Play, 
  RefreshCw, MousePointer2, Activity, Info
} from 'lucide-react';

interface GraphVisualizerProps {
  flow: Flow;
  theme: ThemeMode;
}

interface NodePos {
  id: string;
  x: number;
  y: number;
  level: number;
  task: Task;
}

const GraphVisualizer: React.FC<GraphVisualizerProps> = ({ flow, theme }) => {
  const [zoom, setZoom] = useState(1);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // 1. Compute Dynamic Layout
  const layout = useMemo(() => {
    const tasks = flow.tasks;
    if (tasks.length === 0) return { nodes: [], edges: [], width: 0, height: 0 };

    const nodes: NodePos[] = [];
    const levels: Record<number, string[]> = {};
    // Fix: Explicitly type the Map to ensure proper task type inference
    const taskMap = new Map<string, Task>(tasks.map(t => [t.id, t]));

    // Simple leveling algorithm
    const getLevel = (id: string, visited = new Set<string>()): number => {
      if (visited.has(id)) return 0; // Prevent cycles
      visited.add(id);
      const task = taskMap.get(id);
      // Fix: Ensured task is checked for existence before accessing dependencies
      if (!task || task.dependencies.length === 0) return 0;
      return Math.max(...task.dependencies.map(depId => getLevel(depId, visited))) + 1;
    };

    tasks.forEach(task => {
      const level = getLevel(task.id);
      if (!levels[level]) levels[level] = [];
      levels[level].push(task.id);
    });

    // Positions
    const HORIZONTAL_GAP = 350;
    const VERTICAL_GAP = 180;
    
    Object.keys(levels).forEach((levelStr) => {
      const level = parseInt(levelStr);
      const levelIds = levels[level];
      levelIds.forEach((id, index) => {
        // Fix: Explicitly retrieved the task from the typed map to avoid 'unknown' or empty object inference
        const task = taskMap.get(id)!;
        nodes.push({
          id,
          x: level * HORIZONTAL_GAP + 100,
          y: (index - (levelIds.length - 1) / 2) * VERTICAL_GAP + 400,
          level,
          task
        });
      });
    });

    // Create edges based on dependencies
    const edges: { source: NodePos; target: NodePos; active: boolean }[] = [];
    nodes.forEach(targetNode => {
      targetNode.task.dependencies.forEach(depId => {
        const sourceNode = nodes.find(n => n.id === depId);
        if (sourceNode) {
          edges.push({
            source: sourceNode,
            target: targetNode,
            active: targetNode.task.status === 'in_progress' || sourceNode.task.status === 'in_progress'
          });
        }
      });
      
      // Also draw dashed line from parent if it's a subtask
      if (targetNode.task.parentTaskId) {
        const parentNode = nodes.find(n => n.id === targetNode.task.parentTaskId);
        if (parentNode) {
           // We don't add to standard edges to avoid visual clutter if already dependency-linked
        }
      }
    });

    return { 
      nodes, 
      edges, 
      width: Math.max(...nodes.map(n => n.x)) + 400, 
      height: 800 
    };
  }, [flow.tasks]);

  return (
    <div className="h-full flex flex-col p-8 space-y-6 animate-in fade-in duration-1000">
      {/* Header HUD */}
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-500/20">
              <Share2 size={18} />
            </div>
            <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Topology Mapping</h2>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest opacity-40">
             <span className="flex items-center gap-1"><Cpu size={12}/> {layout.nodes.length} Compute Nodes</span>
             <span className="flex items-center gap-1"><Zap size={12}/> {layout.edges.length} Active Fluxes</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`hidden md:flex items-center gap-6 px-6 py-3 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
             <LegendItem status="completed" label="Synced" />
             <LegendItem status="in_progress" label="Executing" />
             <LegendItem status="decomposing" label="Fractal" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200'}`}>-</button>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200'}`}>+</button>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className={`flex-1 rounded-[3.5rem] border relative overflow-hidden group ${theme === 'dark' ? 'bg-slate-950/50 border-white/5 shadow-inner' : 'bg-slate-50 border-slate-200 shadow-2xl shadow-blue-500/5'}`}>
        
        {/* Futuristic Grid Background */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ 
               backgroundImage: `linear-gradient(${theme === 'dark' ? 'rgba(59,130,246,0.1)' : 'rgba(30,58,138,0.05)'} 1px, transparent 1px), linear-gradient(90deg, ${theme === 'dark' ? 'rgba(59,130,246,0.1)' : 'rgba(30,58,138,0.05)'} 1px, transparent 1px)`, 
               backgroundSize: '40px 40px',
               transform: `scale(${zoom})`
             }} />

        {/* Dynamic SVG Layer */}
        <div className="absolute inset-0 transition-transform duration-500 origin-center cursor-grab active:cursor-grabbing"
             style={{ transform: `scale(${zoom})` }}>
          
          <svg width="100%" height="100%" viewBox={`0 0 ${layout.width} 1000`} className="overflow-visible">
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {/* Render Edges */}
            {layout.edges.map((edge, i) => {
              const dx = edge.target.x - edge.source.x;
              const curve = `M ${edge.source.x + 220} ${edge.source.y} C ${edge.source.x + 220 + dx/2} ${edge.source.y}, ${edge.target.x - dx/2} ${edge.target.y}, ${edge.target.x} ${edge.target.y}`;
              
              return (
                <g key={`edge-${i}`}>
                  <path 
                    d={curve} 
                    fill="none" 
                    stroke={theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} 
                    strokeWidth="2" 
                  />
                  <path 
                    d={curve} 
                    fill="none" 
                    stroke="url(#edgeGradient)" 
                    strokeWidth={edge.active ? "3" : "1.5"} 
                    className={edge.active ? "animate-pulse" : "opacity-30"}
                    filter={edge.active ? "url(#glow)" : "none"}
                  />
                  {edge.active && (
                    <circle r="3" fill="#3b82f6" filter="url(#glow)">
                      <animateMotion dur="2s" repeatCount="indefinite" path={curve} />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* Render Nodes */}
            {layout.nodes.map((node) => (
              <foreignObject 
                key={node.id} 
                x={node.x} 
                y={node.y - 60} 
                width="240" 
                height="120"
                onClick={() => setSelectedNodeId(node.id)}
              >
                <div className={`
                  p-5 rounded-[2rem] border-2 transition-all duration-500 cursor-pointer select-none h-full flex flex-col justify-center
                  ${selectedNodeId === node.id ? 'scale-110 shadow-2xl z-50' : 'hover:scale-105'}
                  ${node.task.status === 'completed' ? 'bg-emerald-500/5 border-emerald-500/20 shadow-lg shadow-emerald-500/5' :
                    node.task.status === 'in_progress' ? 'bg-blue-600/10 border-blue-500 shadow-2xl shadow-blue-500/20' :
                    node.task.status === 'decomposing' ? 'bg-indigo-600/10 border-indigo-500 animate-pulse' :
                    (theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-sm')}
                `}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-1.5 rounded-lg ${getStatusColor(node.task.status)}`}>
                      <StatusIcon status={node.task.status} size={12} />
                    </div>
                    <span className="text-[8px] font-black opacity-30 uppercase tracking-widest">{node.id}</span>
                  </div>
                  <h4 className={`text-xs font-black truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{node.task.title}</h4>
                  <p className="text-[9px] font-bold opacity-40 uppercase tracking-tighter mt-1">{node.task.assignedAgentId || 'Orchestrator'}</p>
                  
                  {node.task.parentTaskId && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-800 text-[7px] font-black text-slate-500 uppercase border border-white/5">
                      Nested Node
                    </div>
                  )}
                </div>
              </foreignObject>
            ))}
          </svg>
        </div>

        {/* HUD Overlay: Minimap / Radar */}
        <div className="absolute bottom-10 right-10 w-48 h-32 rounded-3xl glass-light border border-white/20 p-4 hidden xl:block shadow-2xl pointer-events-none overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={10} className="text-blue-500" />
            <span className="text-[8px] font-black uppercase tracking-widest opacity-50">Spatial Radar</span>
          </div>
          <div className="w-full h-full relative opacity-50">
             {layout.nodes.map(n => (
               <div key={n.id} className={`absolute w-1 h-1 rounded-full ${n.task.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ left: `${(n.x / layout.width) * 100}%`, top: `${(n.y / 1000) * 100}%` }} />
             ))}
             <div className="absolute inset-0 border border-blue-500/20 rounded animate-ping" />
          </div>
        </div>

        {/* Floating Node Info Panel */}
        {selectedNodeId && (
          <div className={`absolute top-10 left-10 w-72 rounded-[2.5rem] border p-8 animate-in slide-in-from-left-4 duration-500 shadow-2xl backdrop-blur-xl ${theme === 'dark' ? 'bg-slate-900/80 border-white/10' : 'bg-white/80 border-slate-200'}`}>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-500">Node Insights</span>
              <button onClick={() => setSelectedNodeId(null)} className="p-1 hover:bg-white/10 rounded-full opacity-50"><RefreshCw size={14}/></button>
            </div>
            {layout.nodes.find(n => n.id === selectedNodeId) && (
              <>
                <h3 className="text-lg font-black italic tracking-tighter uppercase mb-2">{layout.nodes.find(n => n.id === selectedNodeId)?.task.title}</h3>
                <p className="text-[11px] opacity-60 leading-relaxed mb-6">{layout.nodes.find(n => n.id === selectedNodeId)?.task.description}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-3 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="block text-[8px] font-black opacity-30 uppercase mb-1">Status</span>
                    <span className="text-[10px] font-bold uppercase">{layout.nodes.find(n => n.id === selectedNodeId)?.task.status}</span>
                  </div>
                  <div className={`p-3 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="block text-[8px] font-black opacity-30 uppercase mb-1">Depth</span>
                    <span className="text-[10px] font-bold uppercase">Lvl {layout.nodes.find(n => n.id === selectedNodeId)?.level}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const LegendItem = ({ status, label }: { status: TaskStatus, label: string }) => (
  <div className="flex items-center gap-2">
    <div className={`p-1.5 rounded-lg ${getStatusColor(status)}`}>
      <StatusIcon status={status} size={10} />
    </div>
    <span className="text-[9px] font-black uppercase tracking-widest opacity-50">{label}</span>
  </div>
);

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case 'completed': return 'bg-emerald-500/20 text-emerald-500';
    case 'in_progress': return 'bg-blue-500/20 text-blue-500';
    case 'decomposing': return 'bg-indigo-500/20 text-indigo-500';
    case 'failed': return 'bg-red-500/20 text-red-500';
    case 'todo': return 'bg-blue-500/10 text-blue-500/50';
    default: return 'bg-slate-500/10 text-slate-500';
  }
};

const StatusIcon = ({ status, size }: { status: TaskStatus, size: number }) => {
  switch (status) {
    case 'completed': return <CheckCircle2 size={size} />;
    case 'in_progress': return <RefreshCw size={size} className="animate-spin" />;
    case 'decomposing': return <Layers size={size} className="animate-pulse" />;
    case 'failed': return <AlertCircle size={size} />;
    case 'todo': return <Play size={size} />;
    default: return <Clock size={size} />;
  }
};

export default GraphVisualizer;