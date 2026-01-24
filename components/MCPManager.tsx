
import React, { useState } from 'react';
import { Server, Terminal, Shield, Plus, RefreshCw, Lock, Link2, Github, Globe, ExternalLink, Zap, Code, Layout, MessageSquare, Info } from 'lucide-react';
import { ThemeMode } from '../types';

const MCPManager: React.FC<{ theme: ThemeMode }> = ({ theme }) => {
  const [githubUrl, setGithubUrl] = useState('');
  const [webUrl, setWebUrl] = useState('');

  const gitMcpUrl = githubUrl ? githubUrl.replace('github.com', 'gitmcp.io').replace('github.io', 'gitmcp.io') : 'gitmcp.io/username/repo';
  const tomcpUrl = webUrl ? `tomcp.org/${webUrl.replace('https://', '').replace('http://', '')}` : 'tomcp.org/your-docs.com';

  return (
    <div className="h-full overflow-y-auto p-12 space-y-16 animate-in fade-in duration-700 custom-scrollbar">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h2 className="text-4xl font-black italic tracking-tighter uppercase flex items-center gap-4">
            <div className="p-4 bg-blue-600 rounded-[1.5rem] shadow-2xl shadow-blue-500/30 text-white">
              <Server size={32} />
            </div>
            MCP Forge Center
          </h2>
          <p className="text-xs opacity-50 font-bold uppercase tracking-[0.3em] ml-20">Bridge any repository or website into AI context</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* GitMCP Section */}
        <div className={`p-10 rounded-[3.5rem] border flex flex-col space-y-10 transition-all ${theme === 'dark' ? 'bg-slate-900 border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="p-5 bg-black rounded-[2rem] text-white shadow-xl">
                <Github size={32} />
              </div>
              <div>
                <h3 className="text-3xl font-black italic tracking-tighter leading-none">GitMCP</h3>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Code with Confidence</p>
              </div>
            </div>
            <div className="px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-500 text-[9px] font-black uppercase tracking-widest border border-blue-500/20">Remote Protocol</div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">What is GitMCP?</h4>
              <p className="text-xs opacity-60 leading-relaxed font-medium">GitMCP creates a dedicated Model Context Protocol (MCP) server for any GitHub project, enabling AI assistants to understand your code in context.</p>
            </div>

            <div className="p-6 rounded-[2rem] bg-black/40 border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Instant Converter</span>
                <span className="text-[9px] font-mono text-slate-600">github.com ➔ gitmcp.io</span>
              </div>
              <input 
                type="text" 
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="Paste GitHub URL..."
                className={`w-full p-5 rounded-2xl border text-sm font-bold outline-none focus:ring-4 ring-blue-500/10 transition-all ${theme === 'dark' ? 'bg-slate-950 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
              />
              <div className="flex items-center justify-between p-4 bg-blue-600/5 rounded-2xl border border-blue-500/10">
                <code className="text-xs font-bold text-blue-400 truncate max-w-[80%]">{gitMcpUrl}</code>
                <button onClick={() => navigator.clipboard.writeText(gitMcpUrl)} className="p-2 hover:bg-blue-600/20 rounded-xl text-blue-500 transition-all"><ExternalLink size={16}/></button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <ToolAction icon={<Code size={16}/>} label="To MCP" theme={theme}/>
             <ToolAction icon={<MessageSquare size={16}/>} label="To Chat" theme={theme}/>
          </div>
        </div>

        {/* toMCP Section */}
        <div className={`p-10 rounded-[3.5rem] border flex flex-col space-y-10 transition-all ${theme === 'dark' ? 'bg-slate-900 border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="p-5 bg-blue-600 rounded-[2rem] text-white shadow-xl shadow-blue-500/30">
                <Globe size={32} />
              </div>
              <div>
                <h3 className="text-3xl font-black italic tracking-tighter leading-none">toMCP</h3>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Website to Knowledge</p>
              </div>
            </div>
            <div className="px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-500 text-[9px] font-black uppercase tracking-widest border border-indigo-500/20">Bridge Protocol</div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">What is toMCP?</h4>
              <p className="text-xs opacity-60 leading-relaxed font-medium">Convert any website or documentation into an MCP server for your AI tools. Get clean markdown context instantly.</p>
            </div>

            <div className="p-6 rounded-[2rem] bg-indigo-600/5 border border-indigo-500/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Instant Documentation Bridge</span>
                <span className="text-[9px] font-mono text-slate-600">any-site.com ➔ tomcp.org/any-site.com</span>
              </div>
              <input 
                type="text" 
                value={webUrl}
                onChange={(e) => setWebUrl(e.target.value)}
                placeholder="Paste Documentation URL..."
                className={`w-full p-5 rounded-2xl border text-sm font-bold outline-none focus:ring-4 ring-indigo-500/10 transition-all ${theme === 'dark' ? 'bg-slate-950 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
              />
              <div className="flex items-center justify-between p-4 bg-indigo-600/10 rounded-2xl border border-indigo-500/10">
                <code className="text-xs font-bold text-indigo-400 truncate max-w-[80%]">{tomcpUrl}</code>
                <button onClick={() => navigator.clipboard.writeText(tomcpUrl)} className="p-2 hover:bg-indigo-600/20 rounded-xl text-indigo-500 transition-all"><ExternalLink size={16}/></button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <ToolAction icon={<Layout size={16}/>} label="MCP Config" theme={theme}/>
             <ToolAction icon={<Zap size={16}/>} label="Start Chat" theme={theme}/>
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className={`p-10 rounded-[2.5rem] border ${theme === 'dark' ? 'bg-slate-900/50 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
          <h4 className="text-xl font-black italic tracking-tighter uppercase mb-6 flex items-center gap-3">
             <Info size={20} className="text-blue-500" /> Protocol Efficiency
          </h4>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-3 font-black uppercase tracking-widest opacity-40">Feature</th>
                <th className="py-3 font-black uppercase tracking-widest opacity-40">Standard web_fetch</th>
                <th className="py-3 font-black uppercase tracking-widest opacity-40">MCP / Bridge</th>
              </tr>
            </thead>
            <tbody className="opacity-80">
              <tr className="border-b border-white/5">
                <td className="py-4 font-bold">Data Quality</td>
                <td className="py-4">Raw HTML with Noise</td>
                <td className="py-4 text-emerald-500 font-bold italic">Clean Markdown context</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-4 font-bold">Token Cost</td>
                <td className="py-4">High (Wasteful)</td>
                <td className="py-4 text-blue-500 font-bold italic">Low (Optimized)</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-4 font-bold">Persistence</td>
                <td className="py-4">Request only</td>
                <td className="py-4 text-emerald-500 font-bold italic">Always Available</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={`p-10 rounded-[2.5rem] border ${theme === 'dark' ? 'bg-slate-900/50 border-white/5' : 'bg-slate-50 border-slate-200'} flex flex-col justify-center`}>
           <h4 className="text-xl font-black italic tracking-tighter uppercase mb-2">Universal Compatibility</h4>
           <p className="text-xs opacity-50 font-medium mb-8">Works with all popular MCP-compatible AI tools</p>
           <div className="flex flex-wrap gap-3">
             {['Claude', 'Cursor', 'Windsurf', 'VS Code', 'Cline', 'Highlight AI', 'Augment Code'].map(tool => (
               <span key={tool} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>
                 {tool}
               </span>
             ))}
           </div>
        </div>
      </div>
      <div className="text-center opacity-20 text-[10px] font-black uppercase tracking-[0.5em] pb-10">© 2025 Aether Nexus • GitMCP • toMCP Unified Protocol</div>
    </div>
  );
};

const ToolAction = ({ icon, label, theme }: { icon: React.ReactNode, label: string, theme: ThemeMode }) => (
  <button className={`flex items-center justify-center gap-3 py-4 rounded-2xl border font-black uppercase tracking-widest text-[10px] transition-all hover:scale-[1.02] active:scale-95 ${theme === 'dark' ? 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`}>
    {icon} {label}
  </button>
);

export default MCPManager;
