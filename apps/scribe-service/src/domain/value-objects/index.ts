export type SessionStatus = 'active' | 'processing' | 'completed' | 'cancelled';
export type Speaker = 'doctor' | 'patient' | 'nurse' | 'system';
export type MessageCategory = 'symptom' | 'medication' | 'vital' | 'diagnosis' | 'general';
export type TaskType = 'generate_soap' | 'export_fhir';
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ClinicalRiskTier = 'Low' | 'Moderate' | 'High' | 'Critical';
export type RecordType = 'transcript' | 'clinical_entity' | 'vital_sign';

const VALID_SESSION_TRANSITIONS: Record<SessionStatus, SessionStatus[]> = {
  active: ['processing', 'completed', 'cancelled'],
  processing: ['completed', 'failed' as SessionStatus, 'active'],
  completed: [],
  cancelled: [],
};

export function isValidSessionTransition(from: SessionStatus, to: SessionStatus): boolean {
  return VALID_SESSION_TRANSITIONS[from]?.includes(to) ?? false;
}
