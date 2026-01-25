
import { GoogleGenAI, Type } from "@google/genai";
import { Task, Agent } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;
  private readonly MAX_DEPTH = 3; // Limite de sécurité Morssel

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  private isQuotaError(error: any): boolean {
    if (error?.status === 429 || error?.code === 429) return true;
    const errorBody = error?.error || error?.response?.error;
    if (errorBody?.code === 429 || errorBody?.status === "RESOURCE_EXHAUSTED") return true;
    const msg = error?.message?.toLowerCase() || "";
    return msg.includes("429") || msg.includes("quota") || msg.includes("resource_exhausted");
  }

  private async callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 12000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (this.isQuotaError(error)) {
        if (retries > 0) {
          console.warn(`[Morssel v2.2] Rate limit. Cooling for ${delay/1000}s...`);
          await new Promise(r => setTimeout(r, delay));
          return this.callWithRetry(fn, retries - 1, delay * 2);
        }
        throw new Error("QUOTA_EXHAUSTED");
      }
      throw error;
    }
  }

  async planWorkflow(goal: string): Promise<{ projectName: string, tasks: any[] }> {
    return this.callWithRetry(async () => {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Architect a recursive mission for: "${goal}"`,
        config: {
          systemInstruction: `You are the Aether Meta-Architect. 
Decompose goals into a DAG. Initial tasks are Level 0.
Use agentRole to match task types. Output JSON.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              projectName: { type: Type.STRING },
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    agentRole: { type: Type.STRING },
                    dependencies: { type: Type.ARRAY, items: { type: Type.STRING } },
                    requiresApproval: { type: Type.BOOLEAN }
                  },
                  required: ["id", "title", "description", "agentRole", "dependencies", "requiresApproval"]
                }
              }
            },
            required: ["projectName", "tasks"]
          }
        }
      });
      return JSON.parse(response.text.trim());
    });
  }

  /**
   * MORSSEL JUDGE: Now with Depth Awareness
   */
  async judgeTask(task: Task, globalMemory: string): Promise<{ decision: 'execute' | 'decompose' | 'prune', reasoning: string }> {
    const currentDepth = task.depth || 0;
    const isAtLimit = currentDepth >= this.MAX_DEPTH;

    return this.callWithRetry(async () => {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `JUDGE TASK [Level ${currentDepth}]: "${task.title}"\nDESC: ${task.description}\nCONTEXT: ${globalMemory}\nRECURSION_LIMIT: ${this.MAX_DEPTH}`,
        config: {
          systemInstruction: `You are the Morssel Efficiency Judge.
IMPORTANT: Current recursion level is ${currentDepth}. Max allowed is ${this.MAX_DEPTH}.
1. If current level >= ${this.MAX_DEPTH}, decision MUST be 'execute' or 'prune'. NEVER 'decompose'.
2. If task is already fulfilled by memory, decision = 'prune'.
3. If task is a broad macro and level < ${this.MAX_DEPTH}, decision = 'decompose'.
4. Otherwise, 'execute'.
Output JSON.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              decision: { type: Type.STRING, enum: ['execute', 'decompose', 'prune'] },
              reasoning: { type: Type.STRING }
            },
            required: ["decision", "reasoning"]
          }
        }
      });
      return JSON.parse(response.text.trim());
    });
  }

  async decomposeTask(task: Task, context: string): Promise<{ subtasks: any[] }> {
    const nextDepth = (task.depth || 0) + 1;
    return this.callWithRetry(async () => {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Decompose task: "${task.title}" (Level ${task.depth} -> ${nextDepth})\nDescription: ${task.description}\nContext: ${context}`,
        config: {
          systemInstruction: `Morssel Orchestrator: Break this task into 2-3 granular Level ${nextDepth} sub-tasks.
Level ${nextDepth} must be much more specific than Level ${task.depth}. Output JSON.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subtasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    agentRole: { type: Type.STRING }
                  },
                  required: ["id", "title", "description", "agentRole"]
                }
              }
            },
            required: ["subtasks"]
          }
        }
      });
      return JSON.parse(response.text.trim());
    });
  }

  async executeTask(task: Task, agent: Agent, memoryBank: string): Promise<string> {
    return this.callWithRetry(async () => {
      const response = await this.ai.models.generateContent({
        model: agent.model.modelId || 'gemini-3-flash-preview',
        contents: `LEVEL ${task.depth} EXECUTION: ${task.title}\nDESC: ${task.description}\nCONTEXT:\n${memoryBank}`,
        config: {
          systemInstruction: agent.systemPrompt,
        }
      });
      return response.text.trim();
    });
  }
}
