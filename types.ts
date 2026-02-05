
export type MCPTransportType = 'stdio' | 'sse' | 'gitmcp' | 'tomcp';

export interface MCPConfig {
  id: string;
  ownerId: string;
  name: string;
  type: MCPTransportType;
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  capabilities: {
    resources: boolean;
    prompts: boolean;
    tools: boolean;
    logging: boolean;
  };
  status: 'connected' | 'disconnected' | 'error';
  lastSync: any;
}

export interface Agent {
  id: string;
  ownerId: string;
  name: string;
  role: string;
  systemPrompt: string;
  model: {
    provider: 'gemini';
    modelId: string;
    parameters: Record<string, any>;
  };
  mcpServers: string[];
  capabilities: string[];
  memoryConfig: {
    type: 'short-term' | 'long-term' | 'vector';
    namespace: string;
  };
}

export type MedallionStage = 'BRONZE' | 'SILVER' | 'GOLD';

export type TaskStatus = 
  | 'backlog' 
  | 'todo' 
  | 'in_progress' 
  | 'waiting_approval' 
  | 'completed' 
  | 'failed' 
  | 'decomposing' 
  | 'pruned' 
  | 'anticipating' 
  | 'auditing' 
  | 'rejected'
  | 'integrating';

export interface Task {
  id: string;
  flowId: string;
  ownerId: string;
  title: string;
  description: string;
  status: TaskStatus;
  medallionStage: MedallionStage;
  hierarchyPath: string;
  assignedAgentId?: string;
  dependencies: string[];
  parentTaskId?: string;
  depth?: number;
  inputData: any;
  outputData?: {
    result: string;
    timestamp: number;
    artifactType?: 'markdown' | 'code' | 'json';
  };
  requiresApproval: boolean;
  error?: string;
  recommendations?: string[];
  pitfalls?: string[];
  groundingUrls?: { title: string; uri: string }[];
  auditFeedback?: string;
  retryCount?: number;
}

export interface MorsselTelemetry {
  avgReasoningDepth: number;
  totalTokensEstimate: number;
  contextLoad: number;
  memoryBankSize: number;
  prunedTasksCount: number;
  branchingFactor: number;
  auditPassRate: number;
  integrityScore: number;
}

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  createdAt: any;
  updatedAt: any;
}

export interface Flow {
  id: string;
  projectId: string; // Grouping missions under a project
  ownerId: string;
  name: string;
  teamId: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  tasks: Task[];
  contextMemory: Record<string, string>;
  telemetry: MorsselTelemetry;
  workflowGraph: {
    nodes: string[];
    edges: { source: string; target: string; condition?: string }[];
  };
  createdAt?: any;
}

export type ViewMode = 'flow' | 'dag' | 'agents' | 'mcp' | 'settings' | 'artifacts' | 'profile' | 'projects';
export type ThemeMode = 'dark' | 'light';
