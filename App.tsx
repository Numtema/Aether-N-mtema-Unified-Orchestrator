
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Zap, Activity, Share2, Users, Terminal, Settings, 
  Sun, Moon, Layout, Play, Pause, Plus, RefreshCw, 
  ChevronRight, Shield, Server, Box, Cpu, Send, Loader2, X, Download, FileText, Menu, ChevronLeft, AlertTriangle, Info, Clock
} from 'lucide-react';
import { ViewMode, ThemeMode, Flow, Task, Agent, MCPConfig, TaskStatus } from './types';
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
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [systemMessage, setSystemMessage] = useState<{ text: string, type: 'error' | 'warning' | 'info' } | null>(null);
  
  const gemini = useRef(new GeminiService());
  const activeFlow = flows[activeFlowIndex];
  const flowStatusRef = useRef<string>('idle');
  const flowsRef = useRef<Flow[]>([]);

  // Sync flows reference for the orchestrator
  useEffect(() => {
    flowsRef.current = flows;
  }, [flows]);

  useEffect(() => {
    const savedFlows = StorageService.getFlows();
    if (savedFlows.length > 0) {
      setFlows(savedFlows);
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
    }
  }, []);

  useEffect(() => {
    if (flows.length > 0) {
      StorageService.saveFlows(flows);
    }
    if (activeFlow) flowStatusRef.current = activeFlow.status;
  }, [flows, activeFlow]);

  // Cooldown timer
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setInterval(() => setCooldownSeconds(s => s - 1), 1000);
      return () => clearInterval(timer);
    } else if (cooldownSeconds === 0 && systemMessage?.type === 'warning') {
      setSystemMessage(null);
    }
  }, [cooldownSeconds]);

  const handleDeploy = async () => {
    if (!missionInput.trim() || cooldownSeconds > 0) return;
    setIsPlanning(true);
    setSystemMessage(null);
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
          status: 'todo' as TaskStatus,
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
    } catch (error: any) {
      if (error.message === "QUOTA_EXHAUSTED") {
        setCooldownSeconds(60);
        setSystemMessage({ text: "API rate limit reached. System cooling down...", type: 'warning' });
      } else {
        setSystemMessage({ text: error.message || "Failed to architect mission.", type: 'error' });
      }
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
    flowStatusRef.current = newStatus;
    setFlows(prev => prev.map((f, i) => i === activeFlowIndex ? { ...f, status: newStatus } : f));
    if (newStatus === 'running') {
      setSystemMessage(null);
      runOrchestrator();
    }
  };

  const runOrchestrator = async () => {
    const executeNext = async () => {
      if (flowStatusRef.current !== 'running' || cooldownSeconds > 0) return;

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
          setFlows(prev => prev.map((f, i) => i === activeFlowIndex ? { ...f, status: 'completed' } : f));
          return;
        }
        setTimeout(executeNext, 8000); // Poll slowly
        return;
      }

      // Process only one task at a time to stay within quota
      const task = executableTasks[0];
      
      try {
        if (task.status === 'todo') {
          updateTask(task.id, { status: 'decomposing' });
          const decomposition = await gemini.current.decomposeTask(task, "Recursive context.");
          
          if (decomposition.shouldDecompose && decomposition.subtasks) {
            const subtasks: Task[] = decomposition.subtasks.map((st: any) => ({
              id: `${task.id}.${st.id}`,
              flowId: task.flowId,
              parentTaskId: task.id,
              title: st.title,
              description: st.description,
              assignedAgentId: st.agentRole,
              status: 'todo' as TaskStatus,
              dependencies: [...task.dependencies],
              inputData: {},
              requiresApproval: false
            }));

            setFlows(prev => prev.map((f, i) => i === activeFlowIndex ? {
              ...f,
              tasks: [
                ...f.tasks.map(t => t.id === task.id ? { ...t, status: 'todo' as TaskStatus, dependencies: [...t.dependencies, ...subtasks.map(s => s.id)] } : t),
                ...subtasks
              ] as Task[]
            } : f));
            
            setTimeout(executeNext, 12000); // Significant pause after decomposition
            return;
          } else {
            updateTask(task.id, { status: 'in_progress' });
          }
        }

        const agents = StorageService.getAgents();
        const mockAgent = agents.find(a => a.role === task.assignedAgentId) || agents[0];
        const result = await gemini.current.executeTask(task, mockAgent, "Task execution phase.");
        
        updateTask(task.id, { 
          status: 'completed', 
          outputData: { 
            result, 
            timestamp: Date.now(), 
            artifactType: result.includes('```') ? 'code' : 'markdown' 
          } 
        });

      } catch (err: any) {
        if (err.message === "QUOTA_EXHAUSTED") {
          setCooldownSeconds(60);
          setSystemMessage({ text: "Quota exceeded. Engine paused for cooling.", type: 'warning' });
          toggleFlowExecution();
          return;
        }
        updateTask(task.id, { status: 'failed', error: err.message });
      }
      
      if (flowStatusRef.current === 'running') {
        setTimeout(executeNext, 10000); // Throttling
      }
    };

    executeNext();
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
        {/* System Message HUD */}
        {(systemMessage || cooldownSeconds > 0) && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-2xl animate-in slide-in-from-top-4 duration-500">
             <div className={`glass p-4 rounded-2xl border flex items-center justify-between gap-6 shadow-2xl ${systemMessage?.type === 'error' ? 'border-red-500/50 shadow-red-500/10' : 'border-amber-500/50 shadow-amber-500/10'}`}>
                <div className="flex items-center gap-4">
                   <div className={`p-2 rounded-lg text-black ${systemMessage?.type === 'error' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`}>
                      {systemMessage?.type === 'error' ? <AlertTriangle size={20} /> : <Clock size={20} />}
                   </div>
                   <div className="space-y-0.5">
                      <p className={`text-[10px] font-black uppercase tracking-widest ${systemMessage?.type === 'error' ? 'text-red-500' : 'text-amber-500'}`}>
                        {systemMessage?.type === 'error' ? 'System Error' : 'Engine Cooldown'}
                      </p>
                      <p className="text-[11px] font-bold opacity-80">
                        {systemMessage?.text} {cooldownSeconds > 0 ? `(${cooldownSeconds}s left)` : ''}
                      </p>
                   </div>
                </div>
                <button onClick={() => setSystemMessage(null)} className="p-2 hover:bg-white/5 rounded-lg opacity-50 hover:opacity-100 transition-all">
                   <X size={18} />
                </button>
             </div>
          </div>
        )}

        <header className={`h-16 shrink-0 border-b flex items-center justify-between px-8 z-20 ${theme === 'dark' ? 'bg-slate-950/50 border-white/10' : 'bg-white/50 border-black/5'} backdrop-blur-md`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 hover:bg-white/5 rounded-lg text-slate-500 transition-all active:scale-90">
              {isSidebarCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
            </button>
            <div className="h-4 w-px bg-slate-700/50 mx-2" />
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${cooldownSeconds > 0 ? 'bg-amber-500 animate-pulse' : activeFlow?.status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
              <span className="text-[10px] font-mono opacity-50 uppercase tracking-[0.2em]">
                {cooldownSeconds > 0 ? 'cooling' : activeFlow?.status || 'idle'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {activeFlow && (
              <button 
                onClick={toggleFlowExecution}
                disabled={cooldownSeconds > 0}
                className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all active:scale-95 font-black uppercase tracking-widest text-[10px] ${cooldownSeconds > 0 ? 'bg-slate-800 text-slate-500 opacity-50' : activeFlow.status === 'running' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'}`}
              >
                {activeFlow.status === 'running' ? <><Pause size={14} fill="currentColor" /> Stop Core</> : <><Play size={14} fill="currentColor" /> Boot Engine</>}
              </button>
            )}
            <button onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')} className={`p-2.5 rounded-xl transition-colors ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-200'}`}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setShowDeployModal(true)} disabled={cooldownSeconds > 0} className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 active:scale-95 ${cooldownSeconds > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
              + New Mission
            </button>
          </div>
        </header>

        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 flex flex-col">
            {activeFlow && activeView === 'flow' && <Dashboard flow={activeFlow} onTaskUpdate={updateTask} theme={theme} />}
            {activeFlow && activeView === 'dag' && <GraphVisualizer flow={activeFlow} theme={theme} />}
            {activeFlow && activeView === 'artifacts' && <ArtifactsView flow={activeFlow} theme={theme} />}
            {activeView === 'agents' && <AgentConfig theme={theme} />}
            {activeView === 'mcp' && <MCPManager theme={theme} />}
            {activeView === 'settings' && <SettingsView theme={theme} />}
          </div>
        </div>

        {showDeployModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-500">
            <div className={`w-full max-w-2xl rounded-[3rem] border p-12 shadow-2xl ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-5">
                  <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-2xl shadow-blue-500/30">
                    <Zap size={24} fill="currentColor" />
                  </div>
                  Initialize Topo
                </h3>
                <button onClick={() => setShowDeployModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors opacity-30 hover:opacity-100"><X size={28}/></button>
              </div>
              <div className="space-y-10">
                <div className="space-y-4">
                   <textarea 
                    value={missionInput}
                    onChange={(e) => setMissionInput(e.target.value)}
                    placeholder="Brief your objective..."
                    className={`w-full h-56 p-8 rounded-[2.5rem] border outline-none focus:ring-4 ring-blue-500/10 transition-all font-medium text-lg resize-none leading-relaxed ${theme === 'dark' ? 'bg-black/50 border-white/5 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  />
                </div>
                <button 
                  onClick={handleDeploy}
                  disabled={isPlanning || !missionInput.trim()}
                  className={`w-full py-6 rounded-3xl flex items-center justify-center gap-4 font-black uppercase tracking-[0.3em] text-[11px] transition-all ${isPlanning ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xl shadow-blue-600/40 active:scale-[0.98]'}`}
                >
                  {isPlanning ? <><Loader2 className="animate-spin" size={20} /> Architecting...</> : <><Send size={18} /> Deploy Mission</>}
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
