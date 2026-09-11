export interface FhirResource {
  resourceType: string;
  id: string;
  [key: string]: unknown;
}

export interface FhirBundle {
  resourceType: 'Bundle';
  id: string;
  type: 'document';
  timestamp: string;
  entry: FhirBundleEntry[];
}

export interface FhirBundleEntry {
  fullUrl: string;
  resource: FhirResource;
}

export interface FhirComposition extends FhirResource {
  resourceType: 'Composition';
  status: 'final';
  type: { coding: Array<{ system: string; code: string; display: string }> };
  subject: { reference: string };
  encounter: { reference: string };
  date: string;
  author: Array<{ reference: string }>;
  title: string;
  section: Array<{
    title: string;
    code: { coding: Array<{ system: string; code: string; display: string }> };
    text: { status: string; div: string };
  }>;
}

export interface FhirPatient extends FhirResource {
  resourceType: 'Patient';
  name?: Array<{ text: string }>;
  gender?: string;
  birthDate?: string;
  identifier?: Array<{ system: string; value: string }>;
}

export interface FhirPractitioner extends FhirResource {
  resourceType: 'Practitioner';
  identifier?: Array<{ system: string; value: string }>;
  name?: Array<{ text: string }>;
}

export interface FhirEncounter extends FhirResource {
  resourceType: 'Encounter';
  status: string;
  class: { system: string; code: string; display: string };
  subject: { reference: string };
  participant?: Array<{ individual: { reference: string } }>;
  period?: { start: string; end?: string };
}

export interface FhirCondition extends FhirResource {
  resourceType: 'Condition';
  clinicalStatus: { coding: Array<{ system: string; code: string }> };
  code: { coding: Array<{ system: string; code: string; display: string }>; text: string };
  subject: { reference: string };
  encounter: { reference: string };
}

export interface FhirMedicationRequest extends FhirResource {
  resourceType: 'MedicationRequest';
  status: string;
  intent: string;
  medication: { concept: { text: string } };
  subject: { reference: string };
  encounter: { reference: string };
  dosageInstruction?: Array<{
    text: string;
    timing?: { repeat?: { frequency?: number; period?: number; periodUnit?: string } };
    doseAndRate?: Array<{ doseQuantity?: { value?: number; unit?: string } }>;
  }>;
}

export interface FhirObservation extends FhirResource {
  resourceType: 'Observation';
  status: string;
  category?: Array<{ coding: Array<{ system: string; code: string; display: string }> }>;
  code: { coding?: Array<{ system: string; code: string; display: string }>; text: string };
  subject: { reference: string };
  encounter: { reference: string };
  valueString?: string;
}

export interface FormatFhirInput {
  sessionId: string;
  soapNote: {
    subjective: Record<string, unknown>;
    objective: Record<string, unknown>;
    assessment: Record<string, unknown>;
    plan: Record<string, unknown>;
  };
  patientContext?: {
    name?: string;
    age?: number;
    sex?: string;
    mrn?: string;
    allergies?: string[];
    currentMedications?: string[];
  };
  practitionerId?: string;
  specialty?: string;
}
