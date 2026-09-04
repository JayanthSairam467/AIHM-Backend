import { Worker, type Job } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';
import type { TaskRepository, RecordRepository, SoapNoteRepository } from '../repositories/types.js';
import { randomUUID } from 'node:crypto';

export class SoapWorker {
  private worker: Worker;

  constructor(
    connection: ConnectionOptions,
    private taskRepo: TaskRepository,
    private recordRepo: RecordRepository,
    private soapNoteRepo: SoapNoteRepository
  ) {
    this.worker = new Worker(
      'scribe.soap.generation',
      async (job: Job) => {
        const { taskId, sessionId, specialty } = job.data;
        
        await this.taskRepo.updateStatus(taskId, 'processing');

        try {
          const records = await this.recordRepo.findBySessionId(sessionId);
          
          // Call gemini-service HTTP endpoint
          const geminiUrl = process.env.GEMINI_SERVICE_URL || 'http://localhost:4002';
          const response = await fetch(`${geminiUrl}/generate-soap`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              sessionId, 
              specialty, 
              transcript: records.map(r => r.content).join('\n') 
            })
          });
          
          if (!response.ok) throw new Error('Failed to generate SOAP');
          const result = await response.json();

          const note = await this.soapNoteRepo.create({
            id: randomUUID(),
            sessionId,
            subjective: result.subjective,
            objective: result.objective,
            assessment: result.assessment,
            plan: result.plan,
            source: 'gemini',
            version: 1
          });

          await this.taskRepo.markCompleted(taskId, { ...note });
          return note;
        } catch (error: any) {
          await this.taskRepo.markFailed(taskId, error.message);
          throw error;
        }
      },
      { connection }
    );
  }

  async close() {
    await this.worker.close();
  }
}
