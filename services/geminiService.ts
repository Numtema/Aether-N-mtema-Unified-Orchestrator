
import { GoogleGenAI, Type } from "@google/genai";
import { Task, Agent } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  /**
   * Deeply inspects the error object to find 429 / RESOURCE_EXHAUSTED
   */
  private isQuotaError(error: any): boolean {
    // Check for standard status codes
    if (error?.status === 429 || error?.code === 429) return true;
    
    // Check for nested error objects (common in Gemini API responses)
    const errorBody = error?.error || error?.response?.error;
    if (errorBody?.code === 429 || errorBody?.status === "RESOURCE_EXHAUSTED") return true;
    
    // Check message string as fallback
    const msg = error?.message?.toLowerCase() || "";
    return msg.includes("429") || msg.includes("quota") || msg.includes("resource_exhausted");
  }

  private async callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 10000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (this.isQuotaError(error)) {
        if (retries > 0) {
          console.warn(`[Gemini Engine] Rate limit hit. Retrying in ${delay/1000}s...`);
          await new Promise(r => setTimeout(r, delay));
          return this.callWithRetry(fn, retries - 1, delay * 1.5);
        }
        throw new Error("QUOTA_EXHAUSTED");
      }
      throw error;
    }
  }

  async planWorkflow(goal: string): Promise<{ projectName: string, tasks: any[] }> {
    return this.callWithRetry(async () => {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Flash is usually more forgiving for quota
        contents: `Architect a mission for: "${goal}"`,
        config: {
          systemInstruction: `You are the Aether Meta-Agent. Decompose goals into a DAG of high-level tasks. Output strictly JSON.`,
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

  async decomposeTask(task: Task, context: string): Promise<{ shouldDecompose: boolean, subtasks?: any[] }> {
    return this.callWithRetry(async () => {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Evaluate task: "${task.title}"\nDescription: ${task.description}`,
        config: {
          systemInstruction: `Decide if this task needs sub-steps (2-4 tasks). Output JSON.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              shouldDecompose: { type: Type.BOOLEAN },
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
            required: ["shouldDecompose"]
          }
        }
      });
      return JSON.parse(response.text.trim());
    });
  }

  async executeTask(task: Task, agent: Agent, context: string): Promise<string> {
    return this.callWithRetry(async () => {
      const response = await this.ai.models.generateContent({
        model: agent.model.modelId || 'gemini-3-flash-preview',
        contents: `Execute: ${task.title}\nContext: ${context}`,
        config: {
          systemInstruction: agent.systemPrompt,
        }
      });
      return response.text.trim();
    });
  }
}
