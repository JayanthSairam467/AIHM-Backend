import { Queue, type QueueOptions } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';

export class TypedProducer<T> {
  private readonly queue: Queue;

  constructor(
    queueName: string,
    connection: ConnectionOptions,
    private readonly defaultOptions?: Partial<QueueOptions>,
  ) {
    this.queue = new Queue(queueName, {
      connection,
      ...defaultOptions,
    });
  }

  async enqueue(jobName: string, data: T, options?: { jobId?: string; delay?: number; attempts?: number }): Promise<string> {
    const job = await this.queue.add(jobName, data, {
      jobId: options?.jobId,
      delay: options?.delay,
      attempts: options?.attempts ?? 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
    });
    return job.id ?? '';
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}
