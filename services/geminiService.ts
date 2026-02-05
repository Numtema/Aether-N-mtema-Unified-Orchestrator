import { GoogleGenAI, Type } from "@google/genai";
import { Task, Agent } from "../types";

export class GeminiService {
  private readonly MAX_DEPTH = 3;

  constructor() {}

  // Create a new client instance per call to ensure up-to-date API key usage
  private getClient(): GoogleGenAI {
    return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
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
          console.warn(`[Morssel v2.6] Rate limit cooling...`);
          await new Promise(r => setTimeout(r, delay));
          return this.callWithRetry(fn, retries - 1, delay * 2);
        }
        throw new Error("QUOTA_EXHAUSTED");
      }
      throw error;
    }
  }

  // Utility to clean Markdown JSON blocks from AI output
  private cleanJson(text: string): string {
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
  }

  /**
   * RECURSIVE INTEGRITY GUARD: Schema Sentinel
   * Bronze -> Silver transition
   */
  async validateIntegrity(task: Task, siblingTasks: Task[]): Promise<{ isValid: boolean, error?: string, recommendations: string[], pitfalls: string[], urls: {title: string, uri: string}[] }> {
    return this.callWithRetry(async () => {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `INTEGRITY AUDIT [${task.hierarchyPath}]: Analyze task "${task.title}". 
Siblings: ${siblingTasks.map(t => t.title).join(', ')}`,
        config: {
          systemInstruction: `You are the Morssel Schema Sentinel. 
1. Perform Cycle Detection: ensure this task doesn't create a circular recursion.
2. Align Schema: ensure terminology matches siblings.
3. Fetch Best Practices using Google Search.
Output JSON.`,
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isValid: { type: Type.BOOLEAN },
              error: { type: Type.STRING },
              recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
              pitfalls: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["isValid", "recommendations", "pitfalls"]
          }
        }
      });
      
      // Extract grounding URLs from search grounding chunks
      const urls = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.filter(chunk => chunk.web)
        ?.map(chunk => ({ title: chunk.web!.title, uri: chunk.web!.uri })) || [];
      
      const text = response.text || "{}";
      return { ...JSON.parse(this.cleanJson(text)), urls };
    });
  }

  /**
   * BUSINESS AUDITOR: Silver -> Gold transition
   */
  async auditTask(task: Task): Promise<{ approved: boolean, feedback: string }> {
    return this.callWithRetry(async () => {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `GOLD AUDIT: "${task.title}"\nPATH: ${task.hierarchyPath}\nOUTPUT:\n${task.outputData?.result}`,
        config: {
          systemInstruction: `You are the Gold Layer Auditor. 
Check if the output is business-consumable. If the hierarchy path logic is inconsistent, reject.
Output JSON.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              approved: { type: Type.BOOLEAN },
              feedback: { type: Type.STRING }
            },
            required: ["approved", "feedback"]
          }
        }
      });
      const text = response.text || "{}";
      return JSON.parse(this.cleanJson(text));
    });
  }

  async planWorkflow(goal: string, branching: number): Promise<{ projectName: string, tasks: any[] }> {
    return this.callWithRetry(async () => {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Architect "${goal}". Width: ${branching}.`,
        config: {
          systemInstruction: `Initial Bronze Ingestion. Plan high-level nodes. Output JSON.`,
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
      const text = response.text || "{}";
      return JSON.parse(this.cleanJson(text));
    });
  }

  async judgeTask(task: Task, globalMemory: string): Promise<{ decision: 'execute' | 'decompose' | 'prune', reasoning: string }> {
    return this.callWithRetry(async () => {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `JUDGE [Path: ${task.hierarchyPath}]: "${task.title}"\nCONTEXT: ${globalMemory}`,
        config: {
          systemInstruction: `Recursion Manager. Decision: execute/decompose/prune. Output JSON.`,
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
      const text = response.text || "{}";
      return JSON.parse(this.cleanJson(text));
    });
  }

  async decomposeTask(task: Task, context: string, branching: number): Promise<{ subtasks: any[] }> {
    return this.callWithRetry(async () => {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Decompose "${task.title}". Path: ${task.hierarchyPath}. Branching: ${branching}.`,
        config: {
          systemInstruction: `Recursive Decomposition. Create specific children. Output JSON.`,
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
      const text = response.text || "{}";
      return JSON.parse(this.cleanJson(text));
    });
  }

  async executeTask(task: Task, agent: Agent, memoryBank: string): Promise<string> {
    const feedback = task.auditFeedback ? `\nFIX FEEDBACK: ${task.auditFeedback}` : '';
    return this.callWithRetry(async () => {
      const ai = this.getClient();
      // Enforce use of allowed models
      const modelToUse = agent.model.modelId && !['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-pro'].includes(agent.model.modelId)
        ? agent.model.modelId 
        : 'gemini-3-flash-preview';
        
      const response = await ai.models.generateContent({
        model: modelToUse,
        contents: `EXECUTE [${task.hierarchyPath}]: ${task.title}\nCONTEXT:\n${memoryBank}${feedback}`,
        config: { systemInstruction: agent.systemPrompt }
      });
      return response.text || "No output generated.";
    });
  }
}