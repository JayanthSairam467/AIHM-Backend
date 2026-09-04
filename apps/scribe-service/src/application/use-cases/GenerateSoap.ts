import { randomUUID } from 'node:crypto';
import type { SessionRepository, TaskRepository } from '../../infrastructure/repositories/types.js';
import type { MessageQueuePort } from '../ports/index.js';
import { NotFoundError } from '../../domain/errors/index.js';

export interface GenerateSoapInput {
  sessionId: string;
  specialty?: string;
  correlationId: string;
}

export class GenerateSoap {
  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly taskRepo: TaskRepository,
    private readonly queue: MessageQueuePort
  ) {}

  async execute(input: GenerateSoapInput) {
    const session = await this.sessionRepo.findById(input.sessionId);
    if (!session) {
      throw new NotFoundError('Session', input.sessionId);
    }

    const taskId = randomUUID();
    const task = await this.taskRepo.create({
      id: taskId,
      sessionId: input.sessionId,
      taskType: 'generate_soap'
    });

    const jobId = await this.queue.enqueueSoapGeneration({
      taskId,
      sessionId: input.sessionId,
      specialty: input.specialty,
      correlationId: input.correlationId
    });

    return {
      taskId: task.id,
      jobId,
      status: task.status
    };
  }
}
