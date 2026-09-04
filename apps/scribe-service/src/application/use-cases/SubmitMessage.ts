import { randomUUID } from 'node:crypto';
import type { SessionRepository, MessageRepository } from '../../infrastructure/repositories/types.js';
import type { MessageQueuePort } from '../ports/index.js';
import { NotFoundError, ConflictError } from '../../domain/errors/index.js';

export interface SubmitMessageInput {
  sessionId: string;
  speaker: string;
  content: string;
  category?: string;
  correlationId: string;
}

export interface SubmitMessageOutput {
  messageId: string;
  jobId: string;
  sequenceNumber: number;
  status: 'queued';
}

export class SubmitMessage {
  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly messageRepo: MessageRepository,
    private readonly queue: MessageQueuePort
  ) {}

  async execute(input: SubmitMessageInput): Promise<SubmitMessageOutput> {
    const session = await this.sessionRepo.findById(input.sessionId);
    if (!session) {
      throw new NotFoundError('Session', input.sessionId);
    }
    if (session.status !== 'active') {
      throw new ConflictError('Cannot submit messages to a non-active session');
    }

    const sequenceNumber = await this.messageRepo.getNextSequenceNumber(input.sessionId);
    const messageId = randomUUID();

    const jobId = await this.queue.enqueueMessage({
      messageId,
      sessionId: input.sessionId,
      speaker: input.speaker,
      content: input.content,
      category: input.category,
      sequenceNumber,
      correlationId: input.correlationId,
    });

    return {
      messageId,
      jobId,
      sequenceNumber,
      status: 'queued',
    };
  }
}
