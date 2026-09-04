export interface SessionEntity {
  id: string;
  patient_id: string;
  practitioner_id: string;
  specialty: string | null;
  status: 'active' | 'processing' | 'completed' | 'cancelled';
  message_count: number;
  patient_context: PatientContextData | null;
  created_at: string;
  updated_at: string;
}

export interface PatientContextData {
  name?: string;
  age?: number;
  sex?: 'Male' | 'Female' | 'Other';
  mrn?: string;
  allergies?: string[];
  currentMedications?: string[];
}

export interface MessageEntity {
  id: string;
  session_id: string;
  speaker: 'doctor' | 'patient' | 'nurse' | 'system';
  content: string;
  sequence_number: number;
  category: 'symptom' | 'medication' | 'vital' | 'diagnosis' | 'general' | null;
  created_at: string;
}

export interface ClinicalRecordEntity {
  id: string;
  session_id: string;
  record_type: 'transcript' | 'clinical_entity' | 'vital_sign';
  content: Record<string, unknown>;
  source_message_ids: string[];
  created_at: string;
}

export interface TaskEntity {
  id: string;
  session_id: string;
  task_type: 'generate_soap' | 'export_fhir';
  status: 'pending' | 'processing' | 'completed' | 'failed';
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
