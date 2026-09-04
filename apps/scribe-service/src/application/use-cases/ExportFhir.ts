import { randomUUID } from 'node:crypto';
import type { SessionRepository, SoapNoteRepository, TaskRepository } from '../../infrastructure/repositories/types.js';
import type { MessageQueuePort } from '../ports/index.js';
import { NotFoundError, ConflictError } from '../../domain/errors/index.js';

export interface ExportFhirInput {
  sessionId: string;
  correlationId: string;
}

export class ExportFhir {
  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly soapNoteRepo: SoapNoteRepository,
    private readonly taskRepo: TaskRepository,
    private readonly queue: MessageQueuePort
  ) {}

  async execute(input: ExportFhirInput) {
    const session = await this.sessionRepo.findById(input.sessionId);
    if (!session) {
      throw new NotFoundError('Session', input.sessionId);
    }

    const note = await this.soapNoteRepo.findLatestBySessionId(input.sessionId);
    if (!note) {
      throw new ConflictError('Cannot export FHIR without a generated SOAP note');
    }

    const taskId = randomUUID();
    const task = await this.taskRepo.create({
      id: taskId,
      sessionId: input.sessionId,
      taskType: 'export_fhir'
    });

    const jobId = await this.queue.enqueueFhirExport({
      taskId,
      sessionId: input.sessionId,
      correlationId: input.correlationId
    });

    return {
      taskId: task.id,
      jobId,
      status: task.status
    };
  }
}
