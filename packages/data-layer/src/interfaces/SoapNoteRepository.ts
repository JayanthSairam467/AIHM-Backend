import type { SoapNoteEntity } from '../types.js';

export interface CreateSoapNoteInput {
  id: string;
  sessionId: string;
  subjective: Record<string, unknown>;
  objective: Record<string, unknown>;
  assessment: Record<string, unknown>;
  plan: Record<string, unknown>;
  source: string;
  version: number;
}

export interface SoapNoteRepository {
  create(input: CreateSoapNoteInput): Promise<SoapNoteEntity>;
  findLatestBySessionId(sessionId: string): Promise<SoapNoteEntity | null>;
}
