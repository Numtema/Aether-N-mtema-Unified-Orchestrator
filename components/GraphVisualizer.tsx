
import React, { useMemo, useState } from 'react';
import { Flow, Task, ThemeMode, TaskStatus } from '../types';
import { 
  Share2, Layers, Cpu, Zap, 
  CheckCircle2, AlertCircle, Clock, Play, 
  RefreshCw, Activity, Info, GitMerge, ChevronDown, Binary, MousePointer2, X
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
  isSubtask: boolean;
}

const GraphVisualizer: React.FC<GraphVisualizerProps> = ({ flow, theme }) => {
  const [zoom, setZoom] = useState(1);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const layout = useMemo(() => {
    const tasks = flow.tasks;
    if (tasks.length === 0) return { nodes: [], edges: [], hierarchy: [], width: 0, height: 0 };

    const taskMap = new Map<string, Task>(tasks.map(t => [t.id, t]));
    const nodeLevels: Record<string, number> = {};

    const getLevel = (id: string, visited = new Set<string>()): number => {
      if (visited.has(id)) return nodeLevels[id] || 0;
      visited.add(id);
      
      const task = taskMap.get(id);
      if (!task) return 0;

      let parentLevel = -1;
      if (task.parentTaskId) {
        parentLevel = getLevel(task.parentTaskId, visited);
      }

      let depLevel = -1;
      if (task.dependencies.length > 0) {
        depLevel = Math.max(...task.dependencies.map(d => getLevel(d, visited)));
      }

      const finalLevel = Math.max(parentLevel + 1, depLevel + 1, 0);
      nodeLevels[id] = finalLevel;
      return finalLevel;
    };

    tasks.forEach(t => getLevel(t.id));

    const HORIZONTAL_GAP = 420;
    const VERTICAL_GAP = 180;

    const levels: Record<number, string[]> = {};
    Object.entries(nodeLevels).forEach(([id, level]) => {
      if (!levels[level]) levels[level] = [];
      levels[level].push(id);
    });

    // Sort to keep subtasks near parents
    Object.keys(levels).forEach(lvl => {
      levels[parseInt(lvl)].sort((a, b) => {
        const taskA = taskMap.get(a)!;
        const taskB = taskMap.get(b)!;
        if (taskA.parentTaskId === taskB.parentTaskId) return a.localeCompare(b);
        return (taskA.parentTaskId || '').localeCompare(taskB.parentTaskId || '');
      });
    });

    const nodes: NodePos[] = [];
    Object.entries(levels).forEach(([lvlStr, ids]) => {
      const level = parseInt(lvlStr);
      ids.forEach((id, index) => {
        const task = taskMap.get(id)!;
        nodes.push({
          id,
          x: level * HORIZONTAL_GAP + 150,
          y: (index - (ids.length - 1) / 2) * VERTICAL_GAP + 500,
          level,
          task,
          isSubtask: !!task.parentTaskId
        });
      });
    });

    const edges: { source: NodePos; target: NodePos; active: boolean }[] = [];
    const hierarchy: { source: NodePos; target: NodePos }[] = [];

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

      if (targetNode.task.parentTaskId) {
        const parentNode = nodes.find(n => n.id === targetNode.task.parentTaskId);
        if (parentNode) {
          hierarchy.push({ source: parentNode, target: targetNode });
        }
      }
    });

    return { 
      nodes, 
      edges, 
      hierarchy,
      width: Math.max(...nodes.map(n => n.x)) + 600, 
      height: 1000 
    };
  }, [flow.tasks]);

  return (
    <div className="h-full flex flex-col p-8 space-y-6 animate-in fade-in duration-1000">
      {/* Visualizer Header */}
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl text-white shadow-2xl shadow-indigo-500/40 flex items-center justify-center">
              <Binary size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Spatial Topology</h2>
              <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.4em] opacity-40 mt-1">
                <span className="flex items-center gap-1"><Cpu size={10}/> {layout.nodes.length} Compute Nodes</span>
                <span className="flex items-center gap-1 text-blue-500"><Zap size={10}/> {layout.edges.length} Data Fluxes</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`hidden lg:flex items-center gap-8 px-8 py-4 rounded-[2rem] border ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-xl'}`}>
             <LegendItem status="completed" label="Synced" dotColor="bg-emerald-500" />
             <LegendItem status="in_progress" label="Executing" dotColor="bg-blue-500" />
             <LegendItem status="decomposing" label="Fractal" dotColor="bg-indigo-500" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className={`w-12 h-12 rounded-xl flex items-center justify-center border text-xl font-bold transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200'}`}>-</button>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className={`w-12 h-12 rounded-xl flex items-center justify-center border text-xl font-bold transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200'}`}>+</button>
          </div>
        </div>
      </div>

      {/* Graph Area */}
      <div className={`flex-1 rounded-[4rem] border relative overflow-hidden group ${theme === 'dark' ? 'bg-slate-950/80 border-white/5 shadow-inner' : 'bg-slate-50 border-slate-200 shadow-2xl shadow-blue-500/5'}`}>
        
        {/* Deep Field Background Grid */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ 
               backgroundImage: `linear-gradient(${theme === 'dark' ? 'rgba(59,130,246,0.1)' : 'rgba(30,58,138,0.05)'} 1.5px, transparent 1.5px), linear-gradient(90deg, ${theme === 'dark' ? 'rgba(59,130,246,0.1)' : 'rgba(30,58,138,0.05)'} 1.5px, transparent 1.5px)`, 
               backgroundSize: '80px 80px',
               transform: `scale(${zoom})`
             }} />
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ 
               backgroundImage: `linear-gradient(${theme === 'dark' ? 'rgba(59,130,246,0.05)' : 'rgba(30,58,138,0.02)'} 1px, transparent 1px), linear-gradient(90deg, ${theme === 'dark' ? 'rgba(59,130,246,0.05)' : 'rgba(30,58,138,0.02)'} 1px, transparent 1px)`, 
               backgroundSize: '20px 20px',
               transform: `scale(${zoom})`
             }} />

        <div className="absolute inset-0 transition-transform duration-700 ease-out origin-center cursor-crosshair"
             style={{ transform: `scale(${zoom})` }}>
          
          <svg width="100%" height="100%" viewBox={`0 0 ${layout.width} 1200`} className="overflow-visible">
            <defs>
              <filter id="nodeNeon" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="15" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Render Branches (Hierarchical Links) */}
            {layout.hierarchy.map((rel, i) => (
              <path 
                key={`branch-${i}`}
                d={`M ${rel.source.x + 130} ${rel.source.y} L ${rel.target.x} ${rel.target.y}`}
                fill="none" 
                stroke={theme === 'dark' ? 'rgba(99,102,241,0.2)' : 'rgba(79,70,229,0.1)'} 
                strokeWidth="2"
                strokeDasharray="10,6"
                className="animate-in fade-in duration-1000"
              />
            ))}

            {/* Render Flux Paths (Dependency Edges) */}
            {layout.edges.map((edge, i) => {
              const dx = edge.target.x - edge.source.x;
              const curve = `M ${edge.source.x + 280} ${edge.source.y} C ${edge.source.x + 280 + dx/2.5} ${edge.source.y}, ${edge.target.x - dx/2.5} ${edge.target.y}, ${edge.target.x} ${edge.target.y}`;
              
              return (
                <g key={`edge-${i}`}>
                  <path d={curve} fill="none" stroke={theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'} strokeWidth="8" />
                  <path 
                    d={curve} 
                    fill="none" 
                    stroke={edge.active ? "url(#activeGradient)" : (theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')} 
                    strokeWidth={edge.active ? "3" : "1.5"} 
                    className={edge.active ? "animate-pulse" : "opacity-40"}
                  />
                  {edge.active && (
                    <>
                      <circle r="4" fill="#3b82f6" filter="url(#nodeNeon)">
                        <animateMotion dur="2.5s" repeatCount="indefinite" path={curve} />
                      </circle>
                      <circle r="2" fill="white">
                        <animateMotion dur="2.5s" repeatCount="indefinite" path={curve} />
                      </circle>
                    </>
                  )}
                </g>
              );
            })}

            {/* Render Active Nodes */}
            {layout.nodes.map((node) => (
              <foreignObject 
                key={node.id} 
                x={node.x} 
                y={node.y - 65} 
                width="300" 
                height="130"
                onClick={() => setSelectedNodeId(node.id)}
                className="overflow-visible"
              >
                <div className={`
                  p-6 rounded-[2.5rem] border-2 transition-all duration-500 cursor-pointer select-none h-full flex flex-col justify-center relative group/node
                  ${selectedNodeId === node.id ? 'scale-110 shadow-[0_0_60px_rgba(59,130,246,0.2)] border-blue-500 z-50 ring-8 ring-blue-500/5' : 'hover:scale-105'}
                  ${node.task.status === 'completed' ? 'bg-emerald-500/5 border-emerald-500/30' :
                    node.task.status === 'in_progress' ? 'bg-blue-600/10 border-blue-500 shadow-2xl shadow-blue-500/20' :
                    node.task.status === 'decomposing' ? 'bg-indigo-600/10 border-indigo-500 animate-pulse' :
                    (theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-xl')}
                `}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-xl ${getStatusColor(node.task.status)}`}>
                      <StatusIcon status={node.task.status} size={14} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-black opacity-30 uppercase tracking-[0.2em]">{node.id.split('.').pop()}</span>
                      {node.isSubtask && <Layers size={10} className="text-indigo-500" />}
                    </div>
                  </div>
                  
                  <h4 className={`text-sm font-black italic tracking-tighter truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{node.task.title}</h4>
                  <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1 truncate">{node.task.assignedAgentId || 'Orchestrator'}</p>
                  
                  {node.task.outputData && (
                    <div className="absolute -bottom-2 -right-2 p-2 bg-emerald-500 rounded-2xl shadow-xl shadow-emerald-500/40 border-2 border-slate-950">
                      <Binary size={12} className="text-white" />
                    </div>
                  )}

                  {selectedNodeId === node.id && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-[8px] font-black text-white uppercase tracking-widest animate-in zoom-in duration-300 shadow-lg">
                      Active Inspector
                    </div>
                  )}
                </div>
              </foreignObject>
            ))}
          </svg>
        </div>

        {/* Global HUD Overlay */}
        <div className="absolute bottom-12 right-12 w-64 h-40 rounded-[3rem] glass border border-white/10 p-6 hidden xl:block shadow-2xl pointer-events-none opacity-80 backdrop-blur-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={12} className="text-blue-500" />
              <span className="text-[9px] font-black uppercase tracking-widest">Topology Radar</span>
            </div>
            <div className="flex items-center gap-1">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[8px] font-bold opacity-50 uppercase">Sync</span>
            </div>
          </div>
          <div className="w-full h-full relative border border-white/5 rounded-2xl overflow-hidden bg-black/20">
             {layout.nodes.map(n => (
               <div 
                key={n.id} 
                className={`absolute w-1 h-1 rounded-full ${n.task.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-blue-500'}`} 
                style={{ left: `${(n.x / layout.width) * 100}%`, top: `${(n.y / 1200) * 100}%` }} 
               />
             ))}
             <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent animate-pulse" />
          </div>
        </div>

        {/* Dynamic Node Insight Panel */}
        {selectedNodeId && (
          <div className={`absolute top-12 left-12 w-80 rounded-[3rem] border p-10 animate-in slide-in-from-left-8 duration-700 shadow-[0_40px_100px_rgba(0,0,0,0.5)] backdrop-blur-3xl ${theme === 'dark' ? 'bg-slate-900/90 border-white/10' : 'bg-white/90 border-slate-200'}`}>
            <div className="flex justify-between items-start mb-6">
              <div className="px-4 py-1.5 rounded-full bg-indigo-600 text-[8px] font-black text-white uppercase tracking-[0.3em]">Node Descriptor</div>
              <button onClick={() => setSelectedNodeId(null)} className="p-2 hover:bg-white/10 rounded-full transition-all text-slate-500"><X size={20}/></button>
            </div>
            {layout.nodes.find(n => n.id === selectedNodeId) && (
              <>
                <h3 className="text-xl font-black italic tracking-tighter uppercase mb-4 leading-tight">{layout.nodes.find(n => n.id === selectedNodeId)?.task.title}</h3>
                <p className="text-[11px] opacity-60 leading-relaxed mb-8">{layout.nodes.find(n => n.id === selectedNodeId)?.task.description}</p>
                <div className="space-y-4">
                  <div className={`p-5 rounded-3xl border flex justify-between items-center ${theme === 'dark' ? 'bg-white/5 border-white/5 shadow-inner' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                       <GitMerge size={14} className="text-blue-500" />
                       <span className="text-[9px] font-black opacity-40 uppercase">Cluster Depth</span>
                    </div>
                    <span className="text-[11px] font-bold">Lvl {layout.nodes.find(n => n.id === selectedNodeId)?.level}</span>
                  </div>
                  {layout.nodes.find(n => n.id === selectedNodeId)?.task.parentTaskId && (
                    <div className={`p-5 rounded-3xl border flex justify-between items-center ${theme === 'dark' ? 'bg-indigo-600/5 border-indigo-500/20 shadow-inner' : 'bg-indigo-50 border-indigo-100'}`}>
                      <div className="flex items-center gap-3">
                         <Layers size={14} className="text-indigo-500" />
                         <span className="text-[9px] font-black text-indigo-500/50 uppercase">Parent Anchor</span>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-500 truncate max-w-[120px]">{layout.nodes.find(n => n.id === selectedNodeId)?.task.parentTaskId}</span>
                    </div>
                  )}
                  <div className="pt-4 flex justify-center">
                     <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-all">
                        <MousePointer2 size={12} /> Inspect Payload Data
                     </button>
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

const LegendItem = ({ status, label, dotColor }: { status: TaskStatus, label: string, dotColor: string }) => (
  <div className="flex items-center gap-3">
    <div className={`w-2.5 h-2.5 rounded-full ${dotColor} shadow-[0_0_10px_rgba(0,0,0,0.2)]`} />
    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">{label}</span>
  </div>
);

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case 'completed': return 'bg-emerald-500/20 text-emerald-500';
    case 'in_progress': return 'bg-blue-500/20 text-blue-500';
    case 'decomposing': return 'bg-indigo-500/20 text-indigo-500';
    case 'failed': return 'bg-red-500/20 text-red-500';
    case 'todo': return 'bg-slate-500/10 text-slate-500/50';
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
