export interface SessionEntity {
  id: string;
  patient_id: string;
  practitioner_id: string;
  specialty: string | null;
  status: 'active' | 'processing' | 'completed' | 'cancelled';
  message_count: number;
  patient_context: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface MessageEntity {
  id: string;
  session_id: string;
  speaker: string;
  content: string;
  sequence_number: number;
  category: string | null;
  created_at: string;
}

export interface ClinicalRecordEntity {
  id: string;
  session_id: string;
  record_type: string;
  content: Record<string, unknown>;
  source_message_ids: string[];
  created_at: string;
}

export interface TaskEntity {
  id: string;
  session_id: string;
  task_type: string;
  status: string;
  result: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface SoapNoteEntity {
  id: string;
  session_id: string;
  subjective: Record<string, unknown>;
  objective: Record<string, unknown>;
  assessment: Record<string, unknown>;
  plan: Record<string, unknown>;
  source: string;
  version: number;
  created_at: string;
}

export interface FhirBundleEntity {
  id: string;
  session_id: string;
  fhir_version: string;
  resource_count: number;
  bundle: Record<string, unknown>;
  created_at: string;
}

export interface SessionRepository {
  create(input: { id: string; patientId: string; practitionerId: string; specialty?: string; patientContext?: Record<string, unknown> }): Promise<SessionEntity>;
  findById(id: string): Promise<SessionEntity | null>;
  updateStatus(id: string, status: SessionEntity['status']): Promise<SessionEntity>;
  incrementMessageCount(id: string): Promise<void>;
}

export interface MessageRepository {
  create(input: { id: string; sessionId: string; speaker: string; content: string; sequenceNumber: number; category?: string | null }): Promise<MessageEntity>;
  findBySessionId(sessionId: string): Promise<MessageEntity[]>;
  findById(id: string): Promise<MessageEntity | null>;
  getNextSequenceNumber(sessionId: string): Promise<number>;
}

export interface RecordRepository {
  create(input: { id: string; sessionId: string; recordType: string; content: Record<string, unknown>; sourceMessageIds: string[] }): Promise<ClinicalRecordEntity>;
  findBySessionId(sessionId: string): Promise<ClinicalRecordEntity[]>;
}

export interface TaskRepository {
  create(input: { id: string; sessionId: string; taskType: string }): Promise<TaskEntity>;
  findById(id: string): Promise<TaskEntity | null>;
  findBySessionId(sessionId: string): Promise<TaskEntity[]>;
  updateStatus(id: string, status: string, result?: Record<string, unknown>, error?: string): Promise<TaskEntity>;
  markCompleted(id: string, result: Record<string, unknown>): Promise<TaskEntity>;
  markFailed(id: string, error: string): Promise<TaskEntity>;
}

export interface SoapNoteRepository {
  create(input: { id: string; sessionId: string; subjective: Record<string, unknown>; objective: Record<string, unknown>; assessment: Record<string, unknown>; plan: Record<string, unknown>; source: string; version: number }): Promise<SoapNoteEntity>;
  findLatestBySessionId(sessionId: string): Promise<SoapNoteEntity | null>;
}

export interface FhirBundleRepository {
  create(input: { id: string; sessionId: string; fhirVersion: string; resourceCount: number; bundle: Record<string, unknown> }): Promise<FhirBundleEntity>;
  findBySessionId(sessionId: string): Promise<FhirBundleEntity | null>;
}
