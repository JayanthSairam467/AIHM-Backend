export interface MessageQueuePort {
  enqueueMessage(job: {
    messageId: string;
    sessionId: string;
    speaker: string;
    content: string;
    category?: string;
    sequenceNumber: number;
    correlationId: string;
  }): Promise<string>;
  
  enqueueSoapGeneration(job: {
    taskId: string;
    sessionId: string;
    specialty?: string;
    correlationId: string;
  }): Promise<string>;
  
  enqueueFhirExport(job: {
    taskId: string;
    sessionId: string;
    correlationId: string;
  }): Promise<string>;
}
