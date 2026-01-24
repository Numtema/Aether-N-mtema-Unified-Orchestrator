
import React from 'react';
import { Activity, Share2, Users, Terminal, Settings, Zap, FolderOpen, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { ViewMode, ThemeMode, Flow } from '../types';

interface SidebarProps {
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
  theme: ThemeMode;
  flows: Flow[];
  activeFlowIndex: number;
  setActiveFlowIndex: (index: number) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, setActiveView, theme, flows, activeFlowIndex, setActiveFlowIndex, isCollapsed 
}) => {
  return (
    <nav className={`shrink-0 border-r flex flex-col transition-all duration-500 ${isCollapsed ? 'w-20' : 'w-64'} ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-black/5 shadow-xl'}`}>
      <div className={`p-6 flex items-center gap-4 overflow-hidden ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-xl shadow-blue-500/20 shrink-0">
          <Zap className="text-white fill-current" size={20} />
        </div>
        {!isCollapsed && (
          <div className="animate-in fade-in slide-in-from-left-2 duration-300">
            <h1 className="font-black text-lg tracking-tighter uppercase italic leading-none">Aether<span className="text-blue-500">Nexus</span></h1>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Orchestrator v2.0</span>
          </div>
        )}
      </div>

      {/* Project Selector */}
      <div className="px-4 mb-6">
        {!isCollapsed && (
          <div className="flex items-center justify-between px-2 mb-2 animate-in fade-in duration-300">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Projects</span>
            <FolderOpen size={10} className="text-slate-500" />
          </div>
        )}
        <div className="space-y-1">
          {flows.map((flow, idx) => (
            <button
              key={flow.id}
              onClick={() => setActiveFlowIndex(idx)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${idx === activeFlowIndex ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20' : 'text-slate-500 hover:bg-slate-800/50'} ${isCollapsed ? 'justify-center' : ''}`}
              title={flow.name}
            >
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${idx === activeFlowIndex ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-700'}`} />
              {!isCollapsed && <span className="text-[11px] font-bold truncate animate-in fade-in duration-300">{flow.name}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 space-y-2">
        {!isCollapsed && (
          <div className="px-2 mb-2 mt-4 animate-in fade-in duration-300">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Management</span>
          </div>
        )}
        <NavItem 
          icon={<Activity size={20} />} 
          label="Flow Manager" 
          active={activeView === 'flow'} 
          onClick={() => setActiveView('flow')} 
          isCollapsed={isCollapsed}
        />
        <NavItem 
          icon={<Share2 size={20} />} 
          label="DAG Visualizer" 
          active={activeView === 'dag'} 
          onClick={() => setActiveView('dag')} 
          isCollapsed={isCollapsed}
        />
        <NavItem 
          icon={<FileText size={20} />} 
          label="Artifacts" 
          active={activeView === 'artifacts'} 
          onClick={() => setActiveView('artifacts')} 
          isCollapsed={isCollapsed}
        />
        
        {!isCollapsed && (
          <div className="px-2 mb-2 mt-6 animate-in fade-in duration-300">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Resources</span>
          </div>
        )}
        <NavItem 
          icon={<Users size={20} />} 
          label="Agent Squads" 
          active={activeView === 'agents'} 
          onClick={() => setActiveView('agents')} 
          isCollapsed={isCollapsed}
        />
        <NavItem 
          icon={<Terminal size={20} />} 
          label="MCP Bridge" 
          active={activeView === 'mcp'} 
          onClick={() => setActiveView('mcp')} 
          isCollapsed={isCollapsed}
        />
      </div>

      <div className="p-4 border-t border-white/5 space-y-2">
        <NavItem 
          icon={<Settings size={20} />} 
          label="System Config" 
          active={activeView === 'settings'} 
          onClick={() => setActiveView('settings')} 
          isCollapsed={isCollapsed}
        />
      </div>
    </nav>
  );
};

const NavItem = ({ icon, label, active, onClick, isCollapsed }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, isCollapsed: boolean }) => (
  <button 
    onClick={onClick}
    title={isCollapsed ? label : ''}
    className={`
      w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-300
      ${isCollapsed ? 'justify-center' : ''}
      ${active 
        ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' 
        : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'}
    `}
  >
    <span className={`${active ? 'scale-110' : ''} transition-transform shrink-0`}>
      {icon}
    </span>
    {!isCollapsed && <span className="text-sm font-bold tracking-wide truncate animate-in fade-in duration-300">{label}</span>}
  </button>
);

export default Sidebar;
