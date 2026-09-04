import { Worker, type Job } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';
import type { TaskRepository, SoapNoteRepository, FhirBundleRepository } from '../repositories/types.js';
import { randomUUID } from 'node:crypto';

export class FhirWorker {
  private worker: Worker;

  constructor(
    connection: ConnectionOptions,
    private taskRepo: TaskRepository,
    private soapNoteRepo: SoapNoteRepository,
    private fhirBundleRepo: FhirBundleRepository
  ) {
    this.worker = new Worker(
      'fhir.export',
      async (job: Job) => {
        const { taskId, sessionId } = job.data;
        
        await this.taskRepo.updateStatus(taskId, 'processing');

        try {
          const note = await this.soapNoteRepo.findLatestBySessionId(sessionId);
          if (!note) throw new Error('No SOAP note found');
          
          // Call fhir-formatter-service HTTP endpoint here (mocked for now)
          const response = await fetch('http://localhost:3002/format/fhir', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, note })
          });
          
          if (!response.ok) throw new Error('Failed to export FHIR');
          const result = await response.json();

          const bundle = await this.fhirBundleRepo.create({
            id: randomUUID(),
            sessionId,
            fhirVersion: '4.0.1',
            resourceCount: result.entry?.length || 0,
            bundle: result
          });

          await this.taskRepo.markCompleted(taskId, { bundleId: bundle.id });
          return bundle;
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
