
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
        systemInstruction: `You are the Aether Meta-Agent. Decompose the goal into a logical sequence of high-level tasks (DAG). 
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

  /**
   * Analyzes a task and decides if it needs to be broken down into smaller sub-tasks.
   */
  async decomposeTask(task: Task, context: string): Promise<{ shouldDecompose: boolean, subtasks?: any[] }> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Evaluate this task for complexity: "${task.title}"\nDescription: ${task.description}\nContext: ${context}`,
      config: {
        systemInstruction: `You are the Aether Orchestrator. Decide if a task is too complex/broad and needs sub-steps.
If it does, provide a list of sub-tasks. If not, return shouldDecompose: false.
A task should be decomposed if it involves multiple distinct steps (e.g., "Build a full app" -> "UI", "Backend", "Tests").
Sub-tasks will inherit the parent's context and dependencies.`,
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

    const result = JSON.parse(response.text.trim());
    return result;
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
