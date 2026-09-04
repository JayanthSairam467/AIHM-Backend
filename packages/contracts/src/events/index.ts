import { Speaker, MessageCategory } from '../generated/api-types.js';

export interface SubmitMessageJob {
  messageId: string;
  sessionId: string;
  speaker: Speaker;
  content: string;
  category?: MessageCategory;
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
