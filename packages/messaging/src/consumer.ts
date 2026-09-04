import { Worker, type Job } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';

export type JobProcessor<T> = (job: Job<T>) => Promise<void>;

export class TypedConsumer<T> {
  private readonly worker: Worker;

  constructor(
    queueName: string,
    processor: JobProcessor<T>,
    connection: ConnectionOptions,
    options?: { concurrency?: number },
  ) {
    this.worker = new Worker<T>(
      queueName,
      async (job: Job<T>) => {
        await processor(job);
      },
      {
        connection,
        concurrency: options?.concurrency ?? 1,
        autorun: true,
      },
    );

    this.worker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} in queue ${queueName} failed:`, err.message);
    });

    this.worker.on('error', (err) => {
      console.error(`Worker error in queue ${queueName}:`, err.message);
    });
  }

  onCompleted(handler: (job: Job<T>) => void): void {
    this.worker.on('completed', handler);
  }

  onFailed(handler: (job: Job<T> | undefined, err: Error) => void): void {
    this.worker.on('failed', handler);
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}
