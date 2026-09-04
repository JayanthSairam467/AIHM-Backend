import { z } from 'zod';

export const uuidSchema = z.string().uuid();

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.any()).optional(),
  }),
});

export const healthResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']).optional(),
  version: z.string().optional(),
  dependencies: z.object({
    supabase: z.enum(['connected', 'disconnected']).optional(),
    redis: z.enum(['connected', 'disconnected']).optional(),
    gemini: z.enum(['configured', 'unconfigured']).optional(),
  }).optional(),
  timestamp: z.string().datetime().or(z.date()).optional(),
});

export const createSessionRequestSchema = z.object({
  patientId: z.string(),
  practitionerId: z.string(),
  specialty: z.string().optional(),
  patientContext: z.object({
    name: z.string().optional(),
    age: z.number().int().optional(),
    sex: z.enum(['Male', 'Female', 'Other']).optional(),
    mrn: z.string().optional(),
    allergies: z.array(z.string()).optional(),
    currentMedications: z.array(z.string()).optional(),
  }).optional(),
});

export const updateSessionRequestSchema = z.object({
  status: z.enum(['active', 'completed', 'cancelled']).optional(),
});

export const sessionResponseSchema = z.object({
  id: uuidSchema.optional(),
  patientId: z.string().optional(),
  practitionerId: z.string().optional(),
  specialty: z.string().optional(),
  status: z.enum(['active', 'processing', 'completed', 'cancelled']).optional(),
  messageCount: z.number().int().optional(),
  createdAt: z.string().datetime().or(z.date()).optional(),
  updatedAt: z.string().datetime().or(z.date()).optional(),
});

export const submitMessageRequestSchema = z.object({
  speaker: z.enum(['doctor', 'patient', 'nurse', 'system']),
  content: z.string().min(1).max(10000),
  category: z.enum(['symptom', 'medication', 'vital', 'diagnosis', 'general']).optional(),
});

export const messageAcceptedResponseSchema = z.object({
  messageId: uuidSchema.optional(),
  jobId: z.string().optional(),
  sequenceNumber: z.number().int().optional(),
  status: z.enum(['queued']).optional(),
});

export const messageListResponseSchema = z.object({
  sessionId: uuidSchema.optional(),
  messages: z.array(z.object({
    id: uuidSchema.optional(),
    speaker: z.string().optional(),
    content: z.string().optional(),
    sequenceNumber: z.number().int().optional(),
    category: z.string().optional(),
    createdAt: z.string().datetime().or(z.date()).optional(),
  })).optional(),
  total: z.number().int().optional(),
});

export const recordListResponseSchema = z.object({
  sessionId: uuidSchema.optional(),
  records: z.array(z.object({
    id: uuidSchema.optional(),
    recordType: z.enum(['transcript', 'clinical_entity', 'vital_sign']).optional(),
    content: z.any().optional(),
    sourceMessageIds: z.array(uuidSchema).optional(),
    createdAt: z.string().datetime().or(z.date()).optional(),
  })).optional(),
  total: z.number().int().optional(),
});

export const generateSoapRequestSchema = z.object({
  specialty: z.string().optional(),
});

export const taskResponseSchema = z.object({
  id: uuidSchema.optional(),
  sessionId: uuidSchema.optional(),
  taskType: z.enum(['generate_soap', 'export_fhir']).optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  result: z.any().optional(),
  error: z.string().nullable().optional(),
  createdAt: z.string().datetime().or(z.date()).optional(),
  completedAt: z.string().datetime().or(z.date()).nullable().optional(),
});

export const soapNoteResponseSchema = z.object({
  id: uuidSchema.optional(),
  sessionId: uuidSchema.optional(),
  subjective: z.object({
    chiefComplaint: z.string().optional(),
    historyOfPresentIllness: z.string().optional(),
    reviewOfSystems: z.array(z.string()).optional(),
    currentMedications: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
  }).optional(),
  objective: z.object({
    vitalSigns: z.object({
      bloodPressure: z.string().optional(),
      heartRate: z.string().optional(),
      respiratoryRate: z.string().optional(),
      temperature: z.string().optional(),
      spO2: z.string().optional(),
      bmi: z.string().optional(),
    }).optional(),
    physicalExam: z.array(z.string()).optional(),
    labDiagnosticResults: z.array(z.string()).optional(),
  }).optional(),
  assessment: z.object({
    primaryDiagnosis: z.string().optional(),
    icd10Code: z.string().optional(),
    differentialDiagnoses: z.array(z.string()).optional(),
    clinicalRiskTier: z.enum(['Low', 'Moderate', 'High', 'Critical']).optional(),
    clinicalRationale: z.string().optional(),
  }).optional(),
  plan: z.object({
    medicationsPrescribed: z.array(z.object({
      name: z.string().optional(),
      dosage: z.string().optional(),
      frequency: z.string().optional(),
      duration: z.string().optional(),
      instructions: z.string().optional(),
    })).optional(),
    diagnosticOrders: z.array(z.string()).optional(),
    patientEducation: z.array(z.string()).optional(),
    followUp: z.string().optional(),
    redFlagWarnings: z.array(z.string()).optional(),
  }).optional(),
  source: z.string().optional(),
  version: z.number().int().optional(),
  createdAt: z.string().datetime().or(z.date()).optional(),
});

export const fhirBundleResponseSchema = z.object({
  id: uuidSchema.optional(),
  sessionId: uuidSchema.optional(),
  fhirVersion: z.string().optional(),
  resourceCount: z.number().int().optional(),
  bundle: z.any().optional(),
  createdAt: z.string().datetime().or(z.date()).optional(),
});
