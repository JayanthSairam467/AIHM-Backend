import type { SoapNote } from '../../domain/types.js';

export interface GenerateSoapInput {
  transcript: string;
  patientContext?: {
    name?: string;
    age?: number;
    sex?: string;
    mrn?: string;
    allergies?: string[];
    currentMedications?: string[];
  };
  specialty?: string;
}

export interface ClinicalScribeModel {
  generateSoap(input: GenerateSoapInput): Promise<SoapNote>;
}
