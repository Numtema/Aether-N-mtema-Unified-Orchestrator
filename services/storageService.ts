
import { Flow, Agent, MCPConfig } from "../types";

const STORAGE_KEYS = {
  FLOWS: 'aether_flows',
  AGENTS: 'aether_agents',
  MCP: 'aether_mcp_configs'
};

export class StorageService {
  static saveFlows(flows: Flow[]) {
    localStorage.setItem(STORAGE_KEYS.FLOWS, JSON.stringify(flows));
  }

  static getFlows(): Flow[] {
    const data = localStorage.getItem(STORAGE_KEYS.FLOWS);
    return data ? JSON.parse(data) : [];
  }

  static saveAgents(agents: Agent[]) {
    localStorage.setItem(STORAGE_KEYS.AGENTS, JSON.stringify(agents));
  }

  static getAgents(): Agent[] {
    const data = localStorage.getItem(STORAGE_KEYS.AGENTS);
    return data ? JSON.parse(data) : [
      {
        id: 'agent-arch',
        name: 'Architect-Prime',
        role: 'Méta-Architect',
        systemPrompt: 'Expert en architecture système. Analyse les besoins et planifie les DAG.',
        model: { provider: 'gemini', modelId: 'gemini-3-flash-preview', parameters: { temperature: 0.2 } },
        mcpServers: [],
        capabilities: ['planning'],
        memoryConfig: { type: 'short-term', namespace: 'arch' }
      },
      {
        id: 'agent-git',
        name: 'Octo-Analyst',
        role: 'Repo Explorer (GitMCP)',
        systemPrompt: 'Expert en analyse de code via GitMCP. Capable d\'extraire le contexte de n\'importe quel repo GitHub via gitmcp.io.',
        model: { provider: 'gemini', modelId: 'gemini-3-pro-preview', parameters: { temperature: 0.1 } },
        mcpServers: ['gitmcp-default'],
        capabilities: ['code-analysis'],
        memoryConfig: { type: 'short-term', namespace: 'git' }
      },
      {
        id: 'agent-docs',
        name: 'Nexus-Crawler',
        role: 'Docs Integration (toMCP)',
        systemPrompt: 'Expert en crawling de documentation via tomcp.org. Transforme les sites web en ressources structurées.',
        model: { provider: 'gemini', modelId: 'gemini-3-flash-preview', parameters: { temperature: 0.3 } },
        mcpServers: ['tomcp-default'],
        capabilities: ['web-context'],
        memoryConfig: { type: 'short-term', namespace: 'docs' }
      }
    ];
  }

  static saveMCPConfigs(configs: MCPConfig[]) {
    localStorage.setItem(STORAGE_KEYS.MCP, JSON.stringify(configs));
  }

  static getMCPConfigs(): MCPConfig[] {
    const data = localStorage.getItem(STORAGE_KEYS.MCP);
    return data ? JSON.parse(data) : [];
  }
}
