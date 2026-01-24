
import React from 'react';
// Added Plus to the imports from lucide-react to fix the "Cannot find name 'Plus'" error.
import { Settings, Shield, Cpu, Zap, Lock, Globe, Database, Network, Plus } from 'lucide-react';
import { ThemeMode } from '../types';

const SettingsView: React.FC<{ theme: ThemeMode }> = ({ theme }) => {
  return (
    <div className="h-full overflow-y-auto p-12 space-y-12 animate-in slide-in-from-bottom-4 duration-700 custom-scrollbar">
      <div className="space-y-2">
        <h2 className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-4">
          <Settings className="text-slate-500" size={28} /> System Parameters
        </h2>
        <p className="text-xs opacity-50 font-bold uppercase tracking-[0.3em] ml-12">Nexus Core Engine Configuration v1.0.4-LTS</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <ConfigCard 
          icon={<Cpu className="text-blue-500" />} 
          title="Compute Engine" 
          params={[
            { label: 'Primary Model', value: 'gemini-3-pro-preview' },
            { label: 'Fallback Model', value: 'gemini-3-flash-preview' },
            { label: 'Thinking Budget', value: '32k Tokens' }
          ]}
          theme={theme}
        />
        <ConfigCard 
          icon={<Shield className="text-emerald-500" />} 
          title="Security Layer" 
          params={[
            { label: 'API Key Status', value: 'Active / Injection Verified' },
            { label: 'Permissions', value: 'Camera, Mic, Storage' },
            { label: 'Auth Mode', value: 'Local Storage Encrypted' }
          ]}
          theme={theme}
        />
        <ConfigCard 
          icon={<Network className="text-indigo-500" />} 
          title="Protocol Bridge" 
          params={[
            { label: 'GitMCP Proxy', value: 'Enabled (gitmcp.io)' },
            { label: 'toMCP Bridge', value: 'Enabled (tomcp.org)' },
            { label: 'Transport Mode', value: 'SSE / stdio Hybrid' }
          ]}
          theme={theme}
        />
        <ConfigCard 
          icon={<Database className="text-amber-500" />} 
          title="Storage Registry" 
          params={[
            { label: 'Persistence', value: 'LocalStorage' },
            { label: 'Sync Interval', value: 'Real-time' },
            { label: 'Schema Version', value: '2.0-Alpha' }
          ]}
          theme={theme}
        />
        <ConfigCard 
          icon={<Zap className="text-purple-500" />} 
          title="Runtime Quotas" 
          params={[
            { label: 'Max Output Tokens', value: '20,000' },
            { label: 'Execution Timeout', value: '180s' },
            { label: 'Orchestrator Speed', value: 'Standard (1.5s delay)' }
          ]}
          theme={theme}
        />
        <div className={`p-8 rounded-[2.5rem] border border-dashed flex flex-col items-center justify-center text-center opacity-30 ${theme === 'dark' ? 'border-white/10' : 'border-slate-300'}`}>
          <Plus size={32} className="mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest">Add Custom Configuration Node</p>
        </div>
      </div>

      <div className={`p-10 rounded-[3rem] border ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-xl'}`}>
        <h3 className="text-xl font-black italic tracking-tighter uppercase mb-6">Master API Key Config</h3>
        <div className="flex items-center gap-6">
          <div className={`flex-1 p-5 rounded-2xl border font-mono text-xs truncate ${theme === 'dark' ? 'bg-black/40 border-white/10 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
            ••••••••••••••••••••••••••••••••••••••••••••••••••••
          </div>
          <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Rotate Key</button>
        </div>
        <p className="mt-4 text-[10px] opacity-40 font-bold uppercase tracking-widest italic">Note: The API Key is injected via environment variables and stored in the secure session.</p>
      </div>
    </div>
  );
};

const ConfigCard = ({ icon, title, params, theme }: { icon: React.ReactNode, title: string, params: { label: string, value: string }[], theme: ThemeMode }) => (
  <div className={`p-8 rounded-[2.5rem] border transition-all hover:scale-[1.02] ${theme === 'dark' ? 'bg-slate-900 border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}>
    <div className="flex items-center gap-4 mb-8">
      <div className={`p-4 rounded-[1.5rem] ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50 shadow-inner'}`}>
        {icon}
      </div>
      <h3 className="text-xl font-black italic tracking-tighter uppercase leading-none">{title}</h3>
    </div>
    <div className="space-y-4">
      {params.map(p => (
        <div key={p.label} className="flex justify-between items-center gap-4">
          <span className="text-[9px] font-black uppercase tracking-widest opacity-40 shrink-0">{p.label}</span>
          <span className="text-[11px] font-bold text-slate-300 truncate text-right">{p.value}</span>
        </div>
      ))}
    </div>
  </div>
);

export default SettingsView;
