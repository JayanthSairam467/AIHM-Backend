import type { MessageQueuePort } from '../../application/ports/index.js';
import { QueueError } from '../../domain/errors/index.js';
import { Queue } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';

const QUEUE_NAMES = {
  MESSAGE_INGESTION: 'scribe.message.ingestion',
  SOAP_GENERATION: 'scribe.soap.generation',
  FHIR_EXPORT: 'fhir.export',
} as const;

export class ScribeQueueProducer implements MessageQueuePort {
  private readonly messageQueue: Queue;
  private readonly soapQueue: Queue;
  private readonly fhirQueue: Queue;

  constructor(connection: ConnectionOptions) {
    this.messageQueue = new Queue(QUEUE_NAMES.MESSAGE_INGESTION, { connection });
    this.soapQueue = new Queue(QUEUE_NAMES.SOAP_GENERATION, { connection });
    this.fhirQueue = new Queue(QUEUE_NAMES.FHIR_EXPORT, { connection });
  }

  async enqueueMessage(job: Parameters<MessageQueuePort['enqueueMessage']>[0]): Promise<string> {
    try {
      const result = await this.messageQueue.add('process-message', job, {
        jobId: job.messageId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      });
      return result.id ?? '';
    } catch (err) {
      throw new QueueError(QUEUE_NAMES.MESSAGE_INGESTION, (err as Error).message);
    }
  }

  async enqueueSoapGeneration(job: Parameters<MessageQueuePort['enqueueSoapGeneration']>[0]): Promise<string> {
    try {
      const result = await this.soapQueue.add('generate-soap', job, {
        jobId: job.taskId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      });
      return result.id ?? '';
    } catch (err) {
      throw new QueueError(QUEUE_NAMES.SOAP_GENERATION, (err as Error).message);
    }
  }

  async enqueueFhirExport(job: Parameters<MessageQueuePort['enqueueFhirExport']>[0]): Promise<string> {
    try {
      const result = await this.fhirQueue.add('export-fhir', job, {
        jobId: job.taskId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      });
      return result.id ?? '';
    } catch (err) {
      throw new QueueError(QUEUE_NAMES.FHIR_EXPORT, (err as Error).message);
    }
  }

  async close(): Promise<void> {
    await Promise.all([
      this.messageQueue.close(),
      this.soapQueue.close(),
      this.fhirQueue.close(),
    ]);
  }
}
