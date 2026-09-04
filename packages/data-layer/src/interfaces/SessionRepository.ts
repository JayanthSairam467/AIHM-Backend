import type { SessionEntity, PatientContextData } from '../types.js';

export interface CreateSessionInput {
  id: string;
  patientId: string;
  practitionerId: string;
  specialty?: string;
  patientContext?: PatientContextData;
}

export interface SessionRepository {
  create(input: CreateSessionInput): Promise<SessionEntity>;
  findById(id: string): Promise<SessionEntity | null>;
  updateStatus(id: string, status: SessionEntity['status']): Promise<SessionEntity>;
  incrementMessageCount(id: string): Promise<void>;
}
