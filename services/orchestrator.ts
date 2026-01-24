
import { Task, Flow, TaskStatus } from "../types";
import { GeminiService } from "./geminiService";

export class Orchestrator {
  private gemini = new GeminiService();

  /**
   * Processes the next batch of tasks whose dependencies are met.
   */
  async processFlow(flow: Flow, onTaskUpdate: (taskId: string, updates: Partial<Task>) => void): Promise<void> {
    const executableTasks = flow.tasks.filter(t => 
      t.status === 'todo' && 
      t.dependencies.every(depId => 
        flow.tasks.find(pt => pt.id === depId)?.status === 'completed'
      )
    );

    for (const task of executableTasks) {
      if (task.requiresApproval) {
        onTaskUpdate(task.id, { status: 'waiting_approval' });
        continue;
      }

      onTaskUpdate(task.id, { status: 'in_progress' });
      
      try {
        // Here we would find the actual agent and context
        // This is a simulation for the prototype
        const context = "Previous tasks data...";
        // const result = await this.gemini.executeTask(task, mockAgent, context);
        
        // Simulating delay
        await new Promise(r => setTimeout(r, 2000));
        
        // Fix: Updated outputData to include 'result' and 'timestamp' as required by the Task interface
        onTaskUpdate(task.id, { 
          status: 'completed', 
          outputData: { 
            result: `Simulated result for ${task.title}`,
            timestamp: Date.now(),
            artifactType: 'markdown'
          } 
        });
      } catch (err: any) {
        onTaskUpdate(task.id, { status: 'failed', error: err.message });
      }
    }
  }
}
