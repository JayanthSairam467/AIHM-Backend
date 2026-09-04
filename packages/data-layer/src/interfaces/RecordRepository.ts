import type { ClinicalRecordEntity } from '../types.js';

export interface CreateRecordInput {
  id: string;
  sessionId: string;
  recordType: ClinicalRecordEntity['record_type'];
  content: Record<string, unknown>;
  sourceMessageIds: string[];
}

export interface RecordRepository {
  create(input: CreateRecordInput): Promise<ClinicalRecordEntity>;
  findBySessionId(sessionId: string): Promise<ClinicalRecordEntity[]>;
}
