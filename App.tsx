
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Zap, Activity, Share2, Users, Terminal, Settings, 
  Sun, Moon, Layout, Play, Pause, Plus, RefreshCw, 
  ChevronRight, Shield, Server, Box, Cpu, Send, Loader2, X, Download, FileText, Menu, ChevronLeft
} from 'lucide-react';
import { ViewMode, ThemeMode, Flow, Task, Agent, MCPConfig } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import GraphVisualizer from './components/GraphVisualizer';
import AgentConfig from './components/AgentConfig';
import MCPManager from './components/MCPManager';
import SettingsView from './components/SettingsView';
import ArtifactsView from './components/ArtifactsView';
import { StorageService } from './services/storageService';
import { GeminiService } from './services/geminiService';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewMode>('flow');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [flows, setFlows] = useState<Flow[]>([]);
  const [activeFlowIndex, setActiveFlowIndex] = useState<number>(0);
  const [isPlanning, setIsPlanning] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [missionInput, setMissionInput] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const gemini = useRef(new GeminiService());
  const activeFlow = flows[activeFlowIndex];
  const flowStatusRef = useRef<string>('idle');
  const flowsRef = useRef<Flow[]>([]);

  useEffect(() => {
    const savedFlows = StorageService.getFlows();
    if (savedFlows.length > 0) {
      setFlows(savedFlows);
      flowsRef.current = savedFlows;
    } else {
      const demoFlow: Flow = {
        id: 'demo-1',
        name: 'Nexus Alpha Initialization',
        teamId: 'team-1',
        status: 'idle',
        tasks: [],
        workflowGraph: { nodes: [], edges: [] }
      };
      setFlows([demoFlow]);
      flowsRef.current = [demoFlow];
    }
  }, []);

  useEffect(() => {
    if (flows.length > 0) {
      StorageService.saveFlows(flows);
      flowsRef.current = flows;
    }
    if (activeFlow) flowStatusRef.current = activeFlow.status;
  }, [flows, activeFlow]);

  const handleDeploy = async () => {
    if (!missionInput.trim()) return;
    setIsPlanning(true);
    try {
      const plan = await gemini.current.planWorkflow(missionInput);
      const newFlow: Flow = {
        id: `flow-${Date.now()}`,
        name: plan.projectName,
        teamId: 'team-default',
        status: 'idle',
        tasks: plan.tasks.map((t: any) => ({
          ...t,
          flowId: `flow-${Date.now()}`,
          status: 'todo',
          inputData: {},
          requiresApproval: t.requiresApproval || false
        })),
        workflowGraph: {
          nodes: plan.tasks.map((t: any) => t.id),
          edges: plan.tasks.flatMap((t: any) => 
            t.dependencies.map((dep: string) => ({ source: dep, target: t.id }))
          )
        }
      };
      setFlows(prev => [newFlow, ...prev]);
      setActiveFlowIndex(0);
      setShowDeployModal(false);
      setMissionInput('');
    } catch (error) {
      console.error("Planning failed", error);
    } finally {
      setIsPlanning(false);
    }
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setFlows(prev => prev.map((f, i) => i === activeFlowIndex ? {
      ...f,
      tasks: f.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
    } : f));
  };

  const toggleFlowExecution = () => {
    if (!activeFlow) return;
    const newStatus = activeFlow.status === 'running' ? 'paused' : 'running';
    
    // Forcer la mise à jour immédiate pour l'orchestrateur
    flowStatusRef.current = newStatus;
    
    setFlows(prev => prev.map((f, i) => i === activeFlowIndex ? { ...f, status: newStatus } : f));
    
    if (newStatus === 'running') {
      console.log("[Engine] Starting Orchestrator for:", activeFlow.name);
      runOrchestrator();
    }
  };

  const runOrchestrator = async () => {
    const executeNext = async () => {
      // On vérifie le ref pour savoir si on doit continuer ou s'arrêter
      if (flowStatusRef.current !== 'running') {
        console.log("[Engine] Stopped or Paused.");
        return;
      }

      // Utiliser flowsRef pour avoir les données les plus fraîches sans attendre le render cycle
      const currentFlow = flowsRef.current[activeFlowIndex];
      if (!currentFlow) return;

      const executableTasks = currentFlow.tasks.filter(t => 
        t.status === 'todo' && 
        t.dependencies.every(depId => 
          currentFlow.tasks.find(pt => pt.id === depId)?.status === 'completed'
        )
      );

      if (executableTasks.length === 0) {
        const allDone = currentFlow.tasks.length > 0 && currentFlow.tasks.every(t => t.status === 'completed' || t.status === 'failed');
        if (allDone) {
          console.log("[Engine] Flow Completed.");
          setFlows(prev => prev.map((f, i) => i === activeFlowIndex ? { ...f, status: 'completed' } : f));
          return;
        }
        // Attendre que des dépendances se libèrent ou que l'utilisateur ajoute des tâches
        setTimeout(executeNext, 2000);
        return;
      }

      // Exécuter la première tâche disponible
      const task = executableTasks[0];
      updateTask(task.id, { status: 'in_progress' });
      
      try {
        const agents = StorageService.getAgents();
        const mockAgent = agents.find(a => a.role === task.assignedAgentId) || agents[0];
        
        console.log(`[Engine] Executing: ${task.title} with agent ${mockAgent.name}`);
        const result = await gemini.current.executeTask(task, mockAgent, "Pipeline data context placeholder.");
        
        updateTask(task.id, { 
          status: 'completed', 
          outputData: { 
            result, 
            timestamp: Date.now(), 
            artifactType: result.includes('```') ? 'code' : 'markdown' 
          } 
        });
      } catch (err: any) {
        console.error(`[Engine] Task Failed: ${task.title}`, err);
        updateTask(task.id, { status: 'failed', error: err.message });
      }
      
      // Continuer la boucle
      if (flowStatusRef.current === 'running') {
        setTimeout(executeNext, 1000);
      }
    };

    executeNext();
  };

  const downloadProjectReport = () => {
    if (!activeFlow) return;
    const blob = new Blob([JSON.stringify(activeFlow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeFlow.name.replace(/\s+/g, '_')}_Report.json`;
    a.click();
  };

  return (
    <div className={`h-screen w-screen flex transition-colors duration-300 font-sans overflow-hidden ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        theme={theme} 
        flows={flows}
        activeFlowIndex={activeFlowIndex}
        setActiveFlowIndex={setActiveFlowIndex}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className={`h-16 shrink-0 border-b flex items-center justify-between px-8 z-20 ${theme === 'dark' ? 'bg-slate-950/50 border-white/10' : 'bg-white/50 border-black/5'} backdrop-blur-md`}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 hover:bg-white/5 rounded-lg text-slate-500 transition-all active:scale-90"
            >
              {isSidebarCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
            </button>
            <div className="h-4 w-px bg-slate-700/50 mx-2" />
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${activeFlow?.status === 'running' ? 'bg-green-500 animate-pulse' : activeFlow?.status === 'paused' ? 'bg-amber-500' : 'bg-slate-500'}`} />
              <span className="text-[10px] font-mono opacity-50 uppercase tracking-[0.2em]">{activeFlow?.status || 'offline'}</span>
            </div>
            <span className="text-xs font-bold tracking-tight truncate max-w-[250px] ml-4">{activeFlow?.name || 'Aether Control Center'}</span>
          </div>

          <div className="flex items-center gap-4">
            {activeFlow && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleFlowExecution}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all active:scale-95 font-black uppercase tracking-widest text-[10px] ${activeFlow.status === 'running' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}
                >
                  {activeFlow.status === 'running' ? <><Pause size={14} fill="currentColor" /> Pause Engine</> : <><Play size={14} fill="currentColor" /> Run Engine</>}
                </button>
                <button 
                  onClick={downloadProjectReport}
                  className="p-2.5 hover:bg-slate-800 rounded-xl text-slate-400 transition-all active:scale-90"
                  title="Download Project Bundle"
                >
                  <Download size={20} />
                </button>
              </div>
            )}
            <button 
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className={`p-2.5 rounded-xl transition-colors ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-200'}`}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              onClick={() => setShowDeployModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 active:scale-95"
            >
              + Mission
            </button>
          </div>
        </header>

        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 flex flex-col">
            {activeFlow && activeView === 'flow' && <Dashboard flow={activeFlow} onTaskUpdate={updateTask} theme={theme} />}
            {activeFlow && activeView === 'dag' && <GraphVisualizer flow={activeFlow} theme={theme} />}
            {activeFlow && activeView === 'artifacts' && <ArtifactsView flow={activeFlow} theme={theme} />}
            {activeView === 'agents' && <div className="flex-1 overflow-auto"><AgentConfig theme={theme} /></div>}
            {activeView === 'mcp' && <div className="flex-1 overflow-auto"><MCPManager theme={theme} /></div>}
            {activeView === 'settings' && <div className="flex-1 overflow-auto"><SettingsView theme={theme} /></div>}
            
            {!activeFlow && (activeView === 'flow' || activeView === 'dag' || activeView === 'artifacts') && (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-30">
                <Box size={64} className="mb-6" />
                <h2 className="text-xl font-black uppercase tracking-widest">No Active Mission</h2>
                <p className="text-xs font-bold uppercase tracking-widest mt-2">Deploy a new mission to start orchestration</p>
              </div>
            )}
          </div>
        </div>

        {/* Deploy Modal */}
        {showDeployModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className={`w-full max-w-xl rounded-[2.5rem] border p-10 shadow-2xl ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-4">
                  <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-500/20">
                    <Zap size={20} fill="currentColor" />
                  </div>
                  New Mission
                </h3>
                <button onClick={() => setShowDeployModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors opacity-50 hover:opacity-100">
                  <X size={24}/>
                </button>
              </div>
              <div className="space-y-8">
                <textarea 
                  value={missionInput}
                  onChange={(e) => setMissionInput(e.target.value)}
                  placeholder="Describe your goal..."
                  className={`w-full h-48 p-8 rounded-[2rem] border outline-none focus:ring-4 ring-blue-500/10 transition-all font-medium text-base resize-none leading-relaxed ${theme === 'dark' ? 'bg-black/40 border-white/5 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                />
                <button 
                  onClick={handleDeploy}
                  disabled={isPlanning || !missionInput.trim()}
                  className={`w-full py-5 rounded-2xl flex items-center justify-center gap-4 font-black uppercase tracking-[0.25em] text-[10px] transition-all ${isPlanning ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xl shadow-blue-600/40 active:scale-[0.98]'}`}
                >
                  {isPlanning ? <><Loader2 className="animate-spin" size={18} /> Architecting...</> : <><Send size={16} /> Deploy to Nexus</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
