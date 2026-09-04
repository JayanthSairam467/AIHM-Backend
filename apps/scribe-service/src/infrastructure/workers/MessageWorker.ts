import { Worker, type Job } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';
import type { MessageRepository, RecordRepository, SessionRepository } from '../repositories/types.js';
import { randomUUID } from 'node:crypto';

export class MessageWorker {
  private worker: Worker;

  constructor(
    connection: ConnectionOptions,
    private messageRepo: MessageRepository,
    private recordRepo: RecordRepository,
    private sessionRepo: SessionRepository
  ) {
    this.worker = new Worker(
      'scribe.message.ingestion',
      async (job: Job) => {
        const { messageId, sessionId, speaker, content, category, sequenceNumber } = job.data;
        
        // Idempotency check
        const existing = await this.messageRepo.findById(messageId);
        if (existing) return existing;

        const message = await this.messageRepo.create({
          id: messageId,
          sessionId,
          speaker,
          content,
          sequenceNumber,
          category
        });

        await this.recordRepo.create({
          id: randomUUID(),
          sessionId,
          recordType: 'transcript',
          content: { text: content, speaker },
          sourceMessageIds: [messageId]
        });

        await this.sessionRepo.incrementMessageCount(sessionId);
        
        return message;
      },
      { connection }
    );
  }

  async close() {
    await this.worker.close();
  }
}
