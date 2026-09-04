export interface SubmitMessageJob {
  messageId: string;
  sessionId: string;
  speaker: 'doctor' | 'patient' | 'nurse' | 'system';
  content: string;
  category?: 'symptom' | 'medication' | 'vital' | 'diagnosis' | 'general';
  sequenceNumber: number;
  correlationId: string;
}

export interface GenerateSoapJob {
  taskId: string;
  sessionId: string;
  specialty?: string;
  correlationId: string;
}

export interface ExportFhirJob {
  taskId: string;
  sessionId: string;
  correlationId: string;
}

export const QUEUE_NAMES = {
  MESSAGE_INGESTION: 'scribe.message.ingestion',
  SOAP_GENERATION: 'scribe.soap.generation',
  FHIR_EXPORT: 'fhir.export',
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];
