
import React from 'react';
import { Activity, Share2, Users, Terminal, Settings, Zap, FolderOpen, FileText, ChevronDown } from 'lucide-react';
import { ViewMode, ThemeMode, Flow } from '../types';

interface SidebarProps {
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
  theme: ThemeMode;
  flows: Flow[];
  activeFlowIndex: number;
  setActiveFlowIndex: (index: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, theme, flows, activeFlowIndex, setActiveFlowIndex }) => {
  return (
    <nav className={`w-20 md:w-64 shrink-0 border-r flex flex-col transition-all duration-500 ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-black/5 shadow-xl'}`}>
      <div className="p-6 flex items-center gap-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-xl shadow-blue-500/20">
          <Zap className="text-white fill-current" size={20} />
        </div>
        <div className="hidden md:block">
          <h1 className="font-black text-lg tracking-tighter uppercase italic leading-none">Aether<span className="text-blue-500">Nexus</span></h1>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Orchestrator v2.0</span>
        </div>
      </div>

      {/* Project Selector (Organization Section) */}
      <div className="px-4 mb-6">
        <div className="hidden md:flex items-center justify-between px-2 mb-2">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Projects</span>
          <FolderOpen size={10} className="text-slate-500" />
        </div>
        <div className="space-y-1">
          {flows.map((flow, idx) => (
            <button
              key={flow.id}
              onClick={() => setActiveFlowIndex(idx)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${idx === activeFlowIndex ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20' : 'text-slate-500 hover:bg-slate-800/50'}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${idx === activeFlowIndex ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-700'}`} />
              <span className="hidden md:block text-[11px] font-bold truncate">{flow.name}</span>
            </button>
          ))}
          {flows.length === 0 && (
            <div className="hidden md:block p-4 text-center border border-dashed border-slate-800 rounded-xl">
              <span className="text-[9px] font-bold text-slate-600 uppercase">No projects</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 space-y-2">
        <div className="hidden md:block px-2 mb-2 mt-4">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Management</span>
        </div>
        <NavItem 
          icon={<Activity size={20} />} 
          label="Flow Manager" 
          active={activeView === 'flow'} 
          onClick={() => setActiveView('flow')} 
        />
        <NavItem 
          icon={<Share2 size={20} />} 
          label="DAG Visualizer" 
          active={activeView === 'dag'} 
          onClick={() => setActiveView('dag')} 
        />
        <NavItem 
          icon={<FileText size={20} />} 
          label="Artifacts" 
          active={activeView === 'artifacts'} 
          onClick={() => setActiveView('artifacts')} 
        />
        
        <div className="hidden md:block px-2 mb-2 mt-6">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Resources</span>
        </div>
        <NavItem 
          icon={<Users size={20} />} 
          label="Agent Squads" 
          active={activeView === 'agents'} 
          onClick={() => setActiveView('agents')} 
        />
        <NavItem 
          icon={<Terminal size={20} />} 
          label="MCP Bridge" 
          active={activeView === 'mcp'} 
          onClick={() => setActiveView('mcp')} 
        />
      </div>

      <div className="p-4 border-t border-white/5 space-y-2">
        <NavItem 
          icon={<Settings size={20} />} 
          label="System Config" 
          active={activeView === 'settings'} 
          onClick={() => setActiveView('settings')} 
        />
      </div>
    </nav>
  );
};

const NavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-300
      ${active 
        ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' 
        : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'}
    `}
  >
    <span className={`${active ? 'scale-110' : ''} transition-transform`}>
      {icon}
    </span>
    <span className="hidden md:block text-sm font-bold tracking-wide">{label}</span>
  </button>
);

export default Sidebar;
