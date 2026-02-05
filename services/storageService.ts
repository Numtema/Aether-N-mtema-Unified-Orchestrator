
import { 
  collection, doc, setDoc, getDoc, getDocs, query, where, deleteDoc, orderBy, serverTimestamp 
} from "firebase/firestore";
import { db } from "./firebase";
import { Flow, Agent, MCPConfig, Task, Project } from "../types";
import { SqlBridgeService } from "./sqlBridgeService";

/**
 * STORAGE SERVICE UNIFIED
 * Priorise SQL Bridge (Hostinger) si activé, sinon utilise Firestore.
 */
export class StorageService {
  private static USE_SQL = true; // Basculer à true une fois que l'API PHP est en place

  // PROJECTS
  static async saveProject(project: Project) {
    if (this.USE_SQL) {
      return SqlBridgeService.saveRecord('projects', project);
    }
    await setDoc(doc(db, "projects", project.id), {
      ...project,
      updatedAt: serverTimestamp()
    });
  }

  static async getProjects(uid: string): Promise<Project[]> {
    if (this.USE_SQL) {
      return SqlBridgeService.getRecords('projects', { ownerId: uid });
    }
    try {
      const q = query(collection(db, "projects"), where("ownerId", "==", uid), orderBy("updatedAt", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as Project);
    } catch (error: any) {
      console.error("Error fetching projects:", error);
      if (error.message.includes("index")) throw new Error(`INDEX_REQUIRED: ${error.message}`);
      return [];
    }
  }

  static async deleteProject(projectId: string) {
    if (this.USE_SQL) {
      return SqlBridgeService.deleteRecord('projects', projectId);
    }
    await deleteDoc(doc(db, "projects", projectId));
  }

  // FLOWS (Missions)
  static async saveFlow(flow: Flow) {
    if (this.USE_SQL) {
      const { tasks, ...flowMeta } = flow;
      await SqlBridgeService.saveRecord('flows', flowMeta);
      for (const task of tasks) await this.saveTask(task);
      return;
    }
    const { tasks, ...flowMeta } = flow;
    await setDoc(doc(db, "flows", flow.id), { ...flowMeta, updatedAt: serverTimestamp() });
    for (const task of tasks) await this.saveTask(task);
  }

  static async getFlows(uid: string): Promise<Flow[]> {
    if (this.USE_SQL) {
      const flowsMeta = await SqlBridgeService.getRecords('flows', { ownerId: uid });
      const flows: Flow[] = [];
      for (const f of flowsMeta) {
        const tasks = await this.getTasksForFlow(f.id);
        flows.push({ ...f, tasks });
      }
      return flows;
    }
    try {
      const q = query(collection(db, "flows"), where("ownerId", "==", uid), orderBy("updatedAt", "desc"));
      const snap = await getDocs(q);
      const flows: Flow[] = [];
      for (const d of snap.docs) {
        const flowData = d.data() as Flow;
        const tasks = await this.getTasksForFlow(flowData.id);
        flows.push({ ...flowData, tasks });
      }
      return flows;
    } catch (error: any) {
      if (error.message.includes("index")) throw new Error(`INDEX_REQUIRED: ${error.message}`);
      return [];
    }
  }

  // TASKS
  static async saveTask(task: Task) {
    if (this.USE_SQL) return SqlBridgeService.saveRecord('tasks', task);
    await setDoc(doc(db, "tasks", task.id), task);
  }

  static async getTasksForFlow(flowId: string): Promise<Task[]> {
    if (this.USE_SQL) return SqlBridgeService.getRecords('tasks', { flowId: flowId });
    try {
      const q = query(collection(db, "tasks"), where("flowId", "==", flowId));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as Task);
    } catch (error) {
      return [];
    }
  }

  // AGENTS
  static async saveAgents(uid: string, agents: Agent[]) {
    for (const agent of agents) {
      if (this.USE_SQL) {
        await SqlBridgeService.saveRecord('agents', { ...agent, ownerId: uid });
      } else {
        await setDoc(doc(db, "agents", agent.id), { ...agent, ownerId: uid });
      }
    }
  }

  static async getAgents(uid: string): Promise<Agent[]> {
    if (this.USE_SQL) {
      const agents = await SqlBridgeService.getRecords('agents', { ownerId: uid });
      return agents.length > 0 ? agents : this.getDefaultAgents(uid);
    }
    try {
      const q = query(collection(db, "agents"), where("ownerId", "==", uid));
      const snap = await getDocs(q);
      if (snap.empty) return this.getDefaultAgents(uid);
      return snap.docs.map(d => d.data() as Agent);
    } catch (error) {
      return this.getDefaultAgents(uid);
    }
  }

  private static getDefaultAgents(uid: string): Agent[] {
    return [{
      id: `agent-arch-${uid}`,
      ownerId: uid,
      name: 'Architect-Prime',
      role: 'Méta-Architect',
      systemPrompt: 'Expert en architecture système. Analyse les besoins et planifie les DAG.',
      model: { provider: 'gemini', modelId: 'gemini-3-flash-preview', parameters: { temperature: 0.2 } },
      mcpServers: [],
      capabilities: ['planning'],
      memoryConfig: { type: 'short-term', namespace: 'arch' }
    }];
  }

  // MCP CONFIGS
  static async saveMCPConfigs(uid: string, configs: MCPConfig[]) {
    for (const config of configs) {
      if (this.USE_SQL) {
        await SqlBridgeService.saveRecord('mcpConfigs', { ...config, ownerId: uid });
      } else {
        await setDoc(doc(db, "mcpConfigs", config.id), { ...config, ownerId: uid, lastSync: serverTimestamp() });
      }
    }
  }

  static async getMCPConfigs(uid: string): Promise<MCPConfig[]> {
    if (this.USE_SQL) return SqlBridgeService.getRecords('mcpConfigs', { ownerId: uid });
    try {
      const q = query(collection(db, "mcpConfigs"), where("ownerId", "==", uid));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as MCPConfig);
    } catch (error) {
      return [];
    }
  }

  // USER PROFILE
  static async updateProfile(uid: string, data: any) {
    if (this.USE_SQL) return SqlBridgeService.saveRecord('users', { ...data, uid });
    await setDoc(doc(db, "users", uid), { ...data, uid, updatedAt: serverTimestamp() }, { merge: true });
  }

  static async getProfile(uid: string) {
    if (this.USE_SQL) {
      const users = await SqlBridgeService.getRecords('users', { uid: uid });
      return users[0] || null;
    }
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
  }
}
