
import { GoogleGenAI, Type } from "@google/genai";
import { Task, Agent } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  async planWorkflow(goal: string): Promise<{ projectName: string, tasks: any[] }> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `User Goal: "${goal}"`,
      config: {
        systemInstruction: `You are the Aether Meta-Agent. Decompose the goal into a logical sequence of tasks (DAG). 
Ensure dependencies are correct. Output MUST be strictly JSON.`,
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
  }

  async executeTask(task: Task, agent: Agent, context: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: agent.model.modelId || 'gemini-3-flash-preview',
      contents: `TASK: ${task.title}\nDESCRIPTION: ${task.description}\nCONTEXT FROM PREVIOUS TASKS:\n${context}`,
      config: {
        systemInstruction: agent.systemPrompt,
        temperature: agent.model.parameters?.temperature || 0.7
      }
    });

    return response.text.trim();
  }
}
