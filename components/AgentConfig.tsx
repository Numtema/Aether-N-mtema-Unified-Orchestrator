
import React, { useState } from 'react';
import { Users, Plus, Shield, Cpu, Zap, Search, Settings2, Info } from 'lucide-react';
import { ThemeMode, Agent } from '../types';

const AgentConfig: React.FC<{ theme: ThemeMode }> = ({ theme }) => {
  const [search, setSearch] = useState('');

  return (
    <div className="h-full flex flex-col p-8 space-y-8 animate-in slide-in-from-right-4 duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-3">
            <Users className="text-blue-500" /> Agent Squads
          </h2>
          <p className="text-xs opacity-50 uppercase tracking-widest mt-1">Orchestration Cluster: Nexus-Alpha</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
          <Plus size={16} /> New Agent
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Agent Registry */}
        <div className="flex-1 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search by capability or role..."
              className={`w-full pl-12 pr-6 py-4 rounded-2xl border outline-none focus:ring-2 ring-blue-500/20 transition-all font-bold text-sm ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <AgentCard name="Architect-Prime" role="Méta-Architect" status="active" theme={theme} />
            <AgentCard name="Data-Miner-X" role="Scraper & Analysis" status="idle" theme={theme} />
            <AgentCard name="Code-Forge-1" role="Implementation" status="active" theme={theme} />
            <AgentCard name="Verifier-Core" role="Unit Testing" status="idle" theme={theme} />
          </div>
        </div>

        {/* Global Capabilities Sidebar */}
        <div className="w-full md:w-80 shrink-0 space-y-6">
          <div className={`p-8 rounded-[2.5rem] border ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
            <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
              <Zap className="text-amber-500" size={16} /> Cluster Load
            </h3>
            <div className="space-y-6">
              <StatBar label="Reasoning" value={85} color="bg-blue-500" theme={theme} />
              <StatBar label="Token Flux" value={42} color="bg-emerald-500" theme={theme} />
              <StatBar label="Memory Bank" value={61} color="bg-purple-500" theme={theme} />
            </div>
          </div>

          <div className={`p-6 rounded-2xl border flex items-start gap-4 ${theme === 'dark' ? 'bg-blue-600/5 border-blue-500/10 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
            <Info size={20} className="shrink-0 mt-1" />
            <p className="text-xs leading-relaxed font-medium">Agents in "Autonomous" mode will automatically select tasks from the DAG based on capability matching.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const AgentCard = ({ name, role, status, theme }: { name: string, role: string, status: string, theme: ThemeMode }) => (
  <div className={`p-6 rounded-[2rem] border transition-all hover:scale-[1.02] cursor-pointer group ${theme === 'dark' ? 'bg-slate-900 border-white/5 hover:bg-slate-800' : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'}`}>
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'} group-hover:scale-110 transition-transform`}>
        <Cpu size={20} className="text-blue-500" />
      </div>
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${status === 'active' ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-500 bg-slate-500/10'}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
        {status}
      </div>
    </div>
    <h4 className="text-base font-black italic tracking-tighter leading-none mb-1">{name}</h4>
    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{role}</p>
    
    <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
      <div className="flex -space-x-2">
        {[1, 2].map(i => <div key={i} className={`w-6 h-6 rounded-full border ${theme === 'dark' ? 'bg-slate-800 border-slate-900' : 'bg-slate-200 border-white'}`} />)}
      </div>
      <Settings2 size={16} className="text-slate-500 hover:text-blue-500 transition-colors" />
    </div>
  </div>
);

const StatBar = ({ label, value, color, theme }: { label: string, value: number, color: string, theme: ThemeMode }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <div className={`h-1.5 w-full rounded-full overflow-hidden ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}`}>
      <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${value}%` }} />
    </div>
  </div>
);

export default AgentConfig;
