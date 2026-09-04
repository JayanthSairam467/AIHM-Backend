export interface SoapNote {
  subjective: Subjective;
  objective: Objective;
  assessment: Assessment;
  plan: Plan;
}

export interface Subjective {
  chiefComplaint: string;
  historyOfPresentIllness: string;
  reviewOfSystems: string[];
  currentMedications: string[];
  allergies: string[];
}

export interface Objective {
  vitalSigns: VitalSigns;
  physicalExam: string[];
  labDiagnosticResults: string[];
}

export interface VitalSigns {
  bloodPressure: string;
  heartRate: string;
  respiratoryRate: string;
  temperature: string;
  spO2: string;
  bmi: string;
}

export interface Assessment {
  primaryDiagnosis: string;
  icd10Code: string;
  differentialDiagnoses: string[];
  clinicalRiskTier: 'Low' | 'Moderate' | 'High' | 'Critical';
  clinicalRationale: string;
}

export interface Plan {
  medicationsPrescribed: MedicationPrescribed[];
  diagnosticOrders: string[];
  patientEducation: string[];
  followUp: string;
  redFlagWarnings: string[];
}

export interface MedicationPrescribed {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
}
