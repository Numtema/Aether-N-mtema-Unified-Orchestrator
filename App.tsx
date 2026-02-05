
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Zap, Activity, Share2, Users, Terminal, Settings, 
  Sun, Moon, Layout, Play, Pause, Plus, RefreshCw, 
  ChevronRight, Shield, Server, Box, Cpu, Send, Loader2, X, Download, FileText, Menu, ChevronLeft, AlertTriangle, Info, Clock, Sliders, CheckCircle, Search, Database, User as UserIcon, FolderOpen
} from 'lucide-react';
import { ViewMode, ThemeMode, Flow, Task, Agent, MCPConfig, TaskStatus, MorsselTelemetry, Project } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import GraphVisualizer from './components/GraphVisualizer';
import AgentConfig from './components/AgentConfig';
import MCPManager from './components/MCPManager';
import SettingsView from './components/SettingsView';
import ArtifactsView from './components/ArtifactsView';
import ProfileView from './components/ProfileView';
import Auth from './components/Auth';
import { StorageService } from './services/storageService';
import { GeminiService } from './services/geminiService';
import { auth } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(true);

  const [activeView, setActiveView] = useState<ViewMode>('flow');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [flows, setFlows] = useState<Flow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeFlowIndex, setActiveFlowIndex] = useState<number>(0);
  const [isPlanning, setIsPlanning] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [missionInput, setMissionInput] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('default');
  const [branchingFactor, setBranchingFactor] = useState(2);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [systemMessage, setSystemMessage] = useState<{ text: string, type: 'error' | 'warning' | 'info' } | null>(null);
  
  const gemini = useRef(new GeminiService());
  const activeFlow = flows[activeFlowIndex];
  const flowStatusRef = useRef<string>('idle');
  const flowsRef = useRef<Flow[]>([]);

  // Load user session and initial data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.emailVerified) {
        // Initial setup
        await StorageService.updateProfile(user.uid, {
          displayName: user.displayName || 'Architect',
          email: user.email
        });
        
        setCurrentUser(user);
        setShowLanding(false);

        try {
          // Fetch projects first
          const remoteProjects = await StorageService.getProjects(user.uid);
          setProjects(remoteProjects);
          if (remoteProjects.length > 0) {
            setSelectedProjectId(remoteProjects[0].id);
          }

          // Load flows
          const remoteFlows = await StorageService.getFlows(user.uid);
          if (remoteFlows.length > 0) {
              setFlows(remoteFlows);
          } else {
              // Create default flow
              const demoFlow: Flow = {
                  id: `demo-${Date.now()}`,
                  projectId: 'default',
                  ownerId: user.uid,
                  name: 'Morssel Medallion Alpha',
                  teamId: 'team-1',
                  status: 'idle',
                  tasks: [],
                  contextMemory: {},
                  telemetry: { avgReasoningDepth: 0, totalTokensEstimate: 0, contextLoad: 0, memoryBankSize: 0, prunedTasksCount: 0, branchingFactor: 2, auditPassRate: 100, integrityScore: 100 },
                  workflowGraph: { nodes: [], edges: [] }
                };
                setFlows([demoFlow]);
                await StorageService.saveFlow(demoFlow);
          }
        } catch (err: any) {
          console.error("Firestore Loading Error:", err);
          if (err.message.includes("INDEX_REQUIRED")) {
            setSystemMessage({ 
              text: "Action Requise: Des index Firestore sont manquants pour trier vos données. Veuillez cliquer sur le lien dans la console de développement pour les créer.", 
              type: 'warning' 
            });
          }
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    flowsRef.current = flows;
  }, [flows]);

  useEffect(() => {
    if (activeFlow) flowStatusRef.current = activeFlow.status;
  }, [activeFlow]);

  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setInterval(() => setCooldownSeconds(s => s - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldownSeconds]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    setFlows(prev => prev.map((f, i) => i === activeFlowIndex ? {
      ...f,
      tasks: f.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
    } : f));
    
    if (currentUser) {
        const currentTasks = flowsRef.current[activeFlowIndex]?.tasks;
        const taskToUpdate = currentTasks?.find(t => t.id === taskId);
        if (taskToUpdate) {
            await StorageService.saveTask({ ...taskToUpdate, ...updates });
        }
    }
  }, [activeFlowIndex, currentUser]);

  const updateTelemetry = async (updates: Partial<MorsselTelemetry>) => {
    setFlows(prev => prev.map((f, i) => i === activeFlowIndex ? {
      ...f,
      telemetry: { ...f.telemetry, ...updates }
    } : f));
  };

  const runOrchestrator = async () => {
    const executeNext = async () => {
      if (flowStatusRef.current !== 'running' || cooldownSeconds > 0) return;

      const currentFlow = flowsRef.current[activeFlowIndex];
      if (!currentFlow) return;

      const executableTasks = currentFlow.tasks.filter(t => 
        (t.status === 'todo' || t.status === 'rejected') && 
        t.dependencies.every(depId => 
          ['completed', 'pruned'].includes(currentFlow.tasks.find(pt => pt.id === depId)?.status || '')
        )
      );

      if (executableTasks.length === 0) {
        if (currentFlow.tasks.length > 0 && currentFlow.tasks.every(t => ['completed', 'failed', 'pruned'].includes(t.status))) {
          const finishedFlow = { ...currentFlow, status: 'completed' as any };
          setFlows(prev => prev.map((f, i) => i === activeFlowIndex ? finishedFlow : f));
          if (currentUser) StorageService.saveFlow(finishedFlow);
          return;
        }
        setTimeout(executeNext, 8000);
        return;
      }

      const task = executableTasks[0];
      const memoryString = JSON.stringify(currentFlow.contextMemory);
      
      try {
        if (task.medallionStage === 'BRONZE') {
           await updateTask(task.id, { status: 'integrating' });
           const siblings = currentFlow.tasks.filter(t => t.parentTaskId === task.parentTaskId && t.id !== task.id);
           const validation = await gemini.current.validateIntegrity(task, siblings);
           
           if (!validation.isValid) {
              await updateTask(task.id, { status: 'failed', error: `Integrity Loop Detected: ${validation.error}` });
              return;
           }
           
           await updateTask(task.id, { 
              status: 'todo', 
              medallionStage: 'SILVER', 
              recommendations: validation.recommendations, 
              pitfalls: validation.pitfalls,
              groundingUrls: validation.urls
           });
           setTimeout(executeNext, 100);
           return;
        }

        await updateTask(task.id, { status: 'decomposing' });
        const judgment = await gemini.current.judgeTask(task, memoryString);

        if (judgment.decision === 'prune') {
          await updateTask(task.id, { status: 'pruned' });
          updateTelemetry({ prunedTasksCount: (currentFlow.telemetry.prunedTasksCount || 0) + 1 });
        } 
        else if (judgment.decision === 'decompose') {
          const branching = currentFlow.telemetry.branchingFactor || 2;
          const decomposition = await gemini.current.decomposeTask(task, memoryString, branching);
          const nextDepth = (task.depth || 0) + 1;
          
          const subtasks: Task[] = decomposition.subtasks.map((st: any) => ({
            id: `${task.id}.${st.id}`,
            flowId: task.id,
            ownerId: currentUser!.uid,
            parentTaskId: task.id,
            depth: nextDepth,
            title: st.title,
            description: st.description,
            assignedAgentId: st.agentRole,
            status: 'todo' as TaskStatus,
            medallionStage: 'BRONZE' as any,
            hierarchyPath: `${task.hierarchyPath}/${st.id}`,
            dependencies: [...task.dependencies],
            inputData: {},
            requiresApproval: false,
            retryCount: 0
          }));

          const updatedFlow = {
            ...currentFlow,
            tasks: [
              ...currentFlow.tasks.map(t => t.id === task.id ? { ...t, status: 'completed' as TaskStatus, outputData: { result: `Hierarchy Path Expanded: ${task.hierarchyPath}`, timestamp: Date.now() } } : t),
              ...subtasks
            ] as Task[]
          };
          setFlows(prev => prev.map((f, i) => i === activeFlowIndex ? updatedFlow : f));
          if (currentUser) StorageService.saveFlow(updatedFlow);
          updateTelemetry({ avgReasoningDepth: Math.max(currentFlow.telemetry.avgReasoningDepth, nextDepth) });
        } 
        else {
          await updateTask(task.id, { status: 'in_progress' });
          const agents = await StorageService.getAgents(currentUser!.uid);
          const agent = agents.find(a => a.role === task.assignedAgentId) || agents[0];
          const result = await gemini.current.executeTask(task, agent, memoryString);
          
          const tempTask = { ...task, outputData: { result, timestamp: Date.now() } };
          
          await updateTask(task.id, { status: 'auditing' });
          const audit = await gemini.current.auditTask(tempTask);

          if (audit.approved) {
            await updateTask(task.id, { status: 'completed', medallionStage: 'GOLD', outputData: { result, timestamp: Date.now() } });
            const updatedFlow = { 
                ...currentFlow, 
                contextMemory: { ...currentFlow.contextMemory, [task.id]: result.substring(0, 500) } 
            };
            setFlows(prev => prev.map((f, i) => i === activeFlowIndex ? updatedFlow : f));
            if (currentUser) StorageService.saveFlow(updatedFlow);
          } else {
            const retries = (task.retryCount || 0) + 1;
            if (retries > 2) {
              await updateTask(task.id, { status: 'failed', error: `Audit rejected: ${audit.feedback}` });
            } else {
              await updateTask(task.id, { status: 'rejected', auditFeedback: audit.feedback, retryCount: retries });
            }
          }
        }

      } catch (err: any) {
        if (err.message === "QUOTA_EXHAUSTED") {
          setCooldownSeconds(60);
          updateTask(task.id, { status: 'todo' });
          toggleFlowExecution();
          return;
        }
        updateTask(task.id, { status: 'failed', error: err.message });
      }
      
      if (flowStatusRef.current === 'running') {
        setTimeout(executeNext, 6000);
      }
    };

    executeNext();
  };

  const handleDeploy = async () => {
    if (!missionInput.trim() || cooldownSeconds || !currentUser) return;
    setIsPlanning(true);
    setSystemMessage(null);
    try {
      const plan = await gemini.current.planWorkflow(missionInput, branchingFactor);
      const flowId = `flow-${Date.now()}`;
      const newFlow: Flow = {
        id: flowId,
        projectId: selectedProjectId,
        ownerId: currentUser.uid,
        name: plan.projectName,
        teamId: 'team-default',
        status: 'idle',
        tasks: plan.tasks.map((t: any) => ({
          ...t,
          flowId: flowId,
          ownerId: currentUser.uid,
          status: 'todo' as TaskStatus,
          medallionStage: 'BRONZE' as any,
          hierarchyPath: `root/${t.id}`,
          depth: 0,
          inputData: {},
          requiresApproval: t.requiresApproval || false,
          retryCount: 0
        })),
        contextMemory: {},
        telemetry: { avgReasoningDepth: 0, totalTokensEstimate: 0, contextLoad: 0, memoryBankSize: 0, prunedTasksCount: 0, branchingFactor, auditPassRate: 100, integrityScore: 100 },
        workflowGraph: {
          nodes: plan.tasks.map((t: any) => t.id),
          edges: plan.tasks.flatMap((t: any) => 
            t.dependencies.map((dep: string) => ({ source: dep, target: t.id }))
          )
        }
      };
      setFlows(prev => [newFlow, ...prev]);
      setActiveFlowIndex(0);
      await StorageService.saveFlow(newFlow);
      setShowDeployModal(false);
      setMissionInput('');
    } catch (error: any) {
      setSystemMessage({ text: error.message || "Failed.", type: 'error' });
    } finally {
      setIsPlanning(false);
    }
  };

  const toggleFlowExecution = async () => {
    if (!activeFlow || !currentUser) return;
    const newStatus = activeFlow.status === 'running' ? 'paused' : 'running';
    flowStatusRef.current = newStatus;
    const updatedFlow = { ...activeFlow, status: newStatus as any };
    setFlows(prev => prev.map((f, i) => i === activeFlowIndex ? updatedFlow : f));
    await StorageService.saveFlow(updatedFlow);
    if (newStatus === 'running') runOrchestrator();
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 gap-4">
        <Loader2 className="animate-spin text-blue-500" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">Synchronizing Nexus Core...</p>
      </div>
    );
  }

  if (!currentUser) {
    if (showLanding) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 p-12 text-center animate-in fade-in duration-1000">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-10">
            <Zap className="text-white fill-current" size={48} />
          </div>
          <h1 className="text-6xl font-black italic tracking-tighter uppercase mb-6 leading-none">
            Aether<span className="text-blue-500">Nexus</span>
          </h1>
          <p className="max-w-xl text-lg opacity-40 leading-relaxed font-medium mb-12">
            The next-generation autonomous orchestration engine. Recursive decomposition, Medallion architecture, and seamless agent coordination.
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowLanding(false)}
              className="px-12 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-blue-500/20 active:scale-95 transition-all"
            >
              Enter the Nexus
            </button>
          </div>
        </div>
      );
    }
    return <Auth onAuthSuccess={(user) => { setCurrentUser(user); setShowLanding(false); }} onBackToLanding={() => setShowLanding(true)} theme={theme} />;
  }

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
        {(systemMessage || cooldownSeconds > 0) && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-2xl animate-in slide-in-from-top-4 duration-500">
             <div className={`glass p-6 rounded-[2.5rem] border flex items-center justify-between gap-6 shadow-2xl ${systemMessage?.type === 'error' ? 'border-red-500/50 shadow-red-500/10' : (systemMessage?.type === 'warning' ? 'border-amber-500/50 shadow-amber-500/10' : 'border-blue-500/50 shadow-blue-500/10')}`}>
                <div className="flex items-center gap-5">
                   <div className={`p-3 rounded-2xl text-black ${systemMessage?.type === 'error' ? 'bg-red-500' : (systemMessage?.type === 'warning' ? 'bg-amber-500 animate-pulse' : 'bg-blue-500')}`}>
                      {systemMessage?.type === 'error' ? <AlertTriangle size={24} /> : (systemMessage?.type === 'warning' ? <Clock size={24} /> : <Info size={24} />)}
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Morssel System Intelligence</p>
                      <p className="text-[12px] font-bold leading-relaxed">
                        {systemMessage?.text} {cooldownSeconds > 0 ? `(${cooldownSeconds}s remaining)` : ''}
                      </p>
                   </div>
                </div>
                <button onClick={() => setSystemMessage(null)} className="p-3 transition-all opacity-50 hover:opacity-100"><X size={20} /></button>
             </div>
          </div>
        )}

        <header className={`h-16 shrink-0 border-b flex items-center justify-between px-8 z-20 ${theme === 'dark' ? 'bg-slate-950/50 border-white/10' : 'bg-white/50 border-black/5'} backdrop-blur-md`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 text-slate-500">
              {isSidebarCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
            </button>
            <div className="h-4 w-px bg-slate-700/50 mx-2" />
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${activeFlow?.status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
              <span className="text-[10px] font-mono opacity-50 uppercase tracking-[0.2em]">{activeFlow?.status || 'idle'}</span>
            </div>
            {currentUser && (
               <button onClick={() => setActiveView('profile')} className="flex items-center gap-2 ml-4 hover:opacity-80 transition-opacity">
                 <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                   {currentUser.displayName ? currentUser.displayName[0] : currentUser.email![0].toUpperCase()}
                 </div>
                 <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{currentUser.displayName || currentUser.email}</span>
               </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {activeFlow && (
              <button onClick={toggleFlowExecution} className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all font-black uppercase tracking-widest text-[10px] ${activeFlow.status === 'running' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-emerald-600 text-white shadow-lg'}`}>
                {activeFlow.status === 'running' ? <><Pause size={14} fill="currentColor" /> Pause Flux</> : <><Play size={14} fill="currentColor" /> Boot Morssel</>}
              </button>
            )}
            <button onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')} className="p-2.5 rounded-xl hover:bg-white/5 transition-colors">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => {
              // Refresh projects when opening deploy modal
              StorageService.getProjects(currentUser!.uid).then(setProjects);
              setShowDeployModal(true);
            }} className="bg-blue-600 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95">
              + Deploy Task
            </button>
          </div>
        </header>

        <div className="flex-1 relative overflow-hidden">
          {activeFlow && activeView === 'flow' && <Dashboard flow={activeFlow} onTaskUpdate={updateTask} theme={theme} />}
          {activeFlow && activeView === 'dag' && <GraphVisualizer flow={activeFlow} theme={theme} />}
          {activeFlow && activeView === 'artifacts' && <ArtifactsView flow={activeFlow} theme={theme} />}
          {activeView === 'agents' && <AgentConfig theme={theme} />}
          {activeView === 'mcp' && <MCPManager theme={theme} />}
          {activeView === 'settings' && <SettingsView theme={theme} />}
          {activeView === 'profile' && currentUser && <ProfileView user={currentUser} theme={theme} />}
        </div>

        {showDeployModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-500">
            <div className={`w-full max-w-2xl rounded-[3rem] border p-12 shadow-2xl ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-5">
                  <div className="p-4 bg-blue-600 rounded-2xl text-white">
                    <Database size={24} fill="currentColor" />
                  </div>
                  Recursive Medallion Architect
                </h3>
                <button onClick={() => setShowDeployModal(false)} className="opacity-30 hover:opacity-100 transition-all"><X size={28}/></button>
              </div>
              <div className="space-y-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">Target Project Container</label>
                   <div className="relative group">
                     <FolderOpen className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                     <select 
                       value={selectedProjectId}
                       onChange={(e) => setSelectedProjectId(e.target.value)}
                       className={`w-full pl-14 pr-6 py-5 rounded-2xl border outline-none font-bold text-sm appearance-none transition-all ${theme === 'dark' ? 'bg-slate-950/50 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'}`}
                     >
                       <option value="default">Default Project</option>
                       {projects.map(p => (
                         <option key={p.id} value={p.id}>{p.name}</option>
                       ))}
                     </select>
                     <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 rotate-90" size={18} />
                   </div>
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">Root Hierarchy Objective</label>
                   <textarea 
                    value={missionInput}
                    onChange={(e) => setMissionInput(e.target.value)}
                    placeholder="Brief your recursive objective..."
                    className={`w-full h-44 p-8 rounded-[2rem] border outline-none font-medium text-lg resize-none ${theme === 'dark' ? 'bg-black/50 border-white/5 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center ml-4 pr-4">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Branching Logic (Recursive Width)</label>
                    <span className="text-sm font-black text-blue-500">{branchingFactor} Nodes</span>
                  </div>
                  <input 
                    type="range" min="1" max="5" step="1"
                    value={branchingFactor}
                    onChange={(e) => setBranchingFactor(parseInt(e.target.value))}
                    className="w-full h-2 bg-blue-600/20 rounded-lg appearance-none accent-blue-600"
                  />
                </div>

                <button 
                  onClick={handleDeploy}
                  disabled={isPlanning || !missionInput.trim()}
                  className={`w-full py-6 rounded-3xl flex items-center justify-center gap-4 font-black uppercase tracking-[0.3em] text-[11px] ${isPlanning ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 text-white shadow-2xl shadow-blue-600/40 active:scale-95'}`}
                >
                  {isPlanning ? <><Loader2 className="animate-spin" size={20} /> Ingesting Bronze...</> : <><Send size={18} /> Initiate Pipeline</>}
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
