
export type MCPTransportType = 'stdio' | 'sse' | 'gitmcp' | 'tomcp';

export interface MCPConfig {
  id: string;
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
  lastSync: Date;
}

export interface Agent {
  id: string;
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

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'waiting_approval' | 'completed' | 'failed' | 'decomposing';

export interface Task {
  id: string;
  flowId: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignedAgentId?: string;
  dependencies: string[];
  parentTaskId?: string;
  inputData: any;
  outputData?: {
    result: string;
    timestamp: number;
    artifactType?: 'markdown' | 'code' | 'json';
  };
  requiresApproval: boolean;
  error?: string;
}

export interface Flow {
  id: string;
  name: string;
  teamId: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  tasks: Task[];
  workflowGraph: {
    nodes: string[];
    edges: { source: string; target: string; condition?: string }[];
  };
}

export type ViewMode = 'flow' | 'dag' | 'agents' | 'mcp' | 'settings' | 'artifacts';
export type ThemeMode = 'dark' | 'light';
