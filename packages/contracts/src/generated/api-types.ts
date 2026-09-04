export type SessionStatus = 'active' | 'processing' | 'completed' | 'cancelled';
export type Speaker = 'doctor' | 'patient' | 'nurse' | 'system';
export type MessageCategory = 'symptom' | 'medication' | 'vital' | 'diagnosis' | 'general';
export type TaskType = 'generate_soap' | 'export_fhir';
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ClinicalRiskTier = 'Low' | 'Moderate' | 'High' | 'Critical';
export type RecordType = 'transcript' | 'clinical_entity' | 'vital_sign';
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';
export type ConnectionStatus = 'connected' | 'disconnected';
export type GeminiConfigStatus = 'configured' | 'unconfigured';
export type Sex = 'Male' | 'Female' | 'Other';

export interface ErrorDetail {
  [key: string]: any;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: ErrorDetail[];
  };
}

export interface DependencyStatus {
  supabase?: ConnectionStatus;
  redis?: ConnectionStatus;
  gemini?: GeminiConfigStatus;
}

export interface HealthResponse {
  status?: HealthStatus;
  version?: string;
  dependencies?: DependencyStatus;
  timestamp?: string | Date;
}

export interface PatientContext {
  name?: string;
  age?: number;
  sex?: Sex;
  mrn?: string;
  allergies?: string[];
  currentMedications?: string[];
}

export interface CreateSessionRequest {
  patientId: string;
  practitionerId: string;
  specialty?: string;
  patientContext?: PatientContext;
}

export interface UpdateSessionRequest {
  status?: SessionStatus;
}

export interface SessionResponse {
  id?: string;
  patientId?: string;
  practitionerId?: string;
  specialty?: string;
  status?: SessionStatus;
  messageCount?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface SubmitMessageRequest {
  speaker: Speaker;
  content: string;
  category?: MessageCategory;
}

export interface MessageAcceptedResponse {
  messageId?: string;
  jobId?: string;
  sequenceNumber?: number;
  status?: 'queued';
}

export interface MessageItem {
  id?: string;
  speaker?: string;
  content?: string;
  sequenceNumber?: number;
  category?: string;
  createdAt?: string | Date;
}

export interface MessageListResponse {
  sessionId?: string;
  messages?: MessageItem[];
  total?: number;
}

export interface RecordItem {
  id?: string;
  recordType?: RecordType;
  content?: any;
  sourceMessageIds?: string[];
  createdAt?: string | Date;
}

export interface RecordListResponse {
  sessionId?: string;
  records?: RecordItem[];
  total?: number;
}

export interface GenerateSoapRequest {
  specialty?: string;
}

export interface TaskResponse {
  id?: string;
  sessionId?: string;
  taskType?: TaskType;
  status?: TaskStatus;
  result?: any;
  error?: string | null;
  createdAt?: string | Date;
  completedAt?: string | Date | null;
}

export interface VitalSigns {
  bloodPressure?: string;
  heartRate?: string;
  respiratoryRate?: string;
  temperature?: string;
  spO2?: string;
  bmi?: string;
}

export interface Subjective {
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  reviewOfSystems?: string[];
  currentMedications?: string[];
  allergies?: string[];
}

export interface Objective {
  vitalSigns?: VitalSigns;
  physicalExam?: string[];
  labDiagnosticResults?: string[];
}

export interface Assessment {
  primaryDiagnosis?: string;
  icd10Code?: string;
  differentialDiagnoses?: string[];
  clinicalRiskTier?: ClinicalRiskTier;
  clinicalRationale?: string;
}

export interface MedicationPrescribed {
  name?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
}

export interface Plan {
  medicationsPrescribed?: MedicationPrescribed[];
  diagnosticOrders?: string[];
  patientEducation?: string[];
  followUp?: string;
  redFlagWarnings?: string[];
}

export interface SoapNoteResponse {
  id?: string;
  sessionId?: string;
  subjective?: Subjective;
  objective?: Objective;
  assessment?: Assessment;
  plan?: Plan;
  source?: string;
  version?: number;
  createdAt?: string | Date;
}

export interface FhirBundleResponse {
  id?: string;
  sessionId?: string;
  fhirVersion?: string;
  resourceCount?: number;
  bundle?: any;
  createdAt?: string | Date;
}
