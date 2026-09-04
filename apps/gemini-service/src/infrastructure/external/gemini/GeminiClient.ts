import { GoogleGenAI, Type, Schema } from '@google/genai';
import { ProviderError } from '../../../domain/errors.js';

const soapResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    subjective: {
      type: Type.OBJECT,
      properties: {
        chiefComplaint: { type: Type.STRING },
        historyOfPresentIllness: { type: Type.STRING },
        reviewOfSystems: { type: Type.ARRAY, items: { type: Type.STRING } },
        currentMedications: { type: Type.ARRAY, items: { type: Type.STRING } },
        allergies: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['chiefComplaint', 'historyOfPresentIllness', 'reviewOfSystems', 'currentMedications', 'allergies']
    },
    objective: {
      type: Type.OBJECT,
      properties: {
        vitalSigns: {
          type: Type.OBJECT,
          properties: {
            bloodPressure: { type: Type.STRING },
            heartRate: { type: Type.STRING },
            respiratoryRate: { type: Type.STRING },
            temperature: { type: Type.STRING },
            spO2: { type: Type.STRING },
            bmi: { type: Type.STRING }
          },
          required: ['bloodPressure', 'heartRate', 'respiratoryRate', 'temperature', 'spO2', 'bmi']
        },
        physicalExam: { type: Type.ARRAY, items: { type: Type.STRING } },
        labDiagnosticResults: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['vitalSigns', 'physicalExam', 'labDiagnosticResults']
    },
    assessment: {
      type: Type.OBJECT,
      properties: {
        primaryDiagnosis: { type: Type.STRING },
        icd10Code: { type: Type.STRING },
        differentialDiagnoses: { type: Type.ARRAY, items: { type: Type.STRING } },
        clinicalRiskTier: { type: Type.STRING, enum: ['Low', 'Moderate', 'High', 'Critical'] },
        clinicalRationale: { type: Type.STRING }
      },
      required: ['primaryDiagnosis', 'icd10Code', 'differentialDiagnoses', 'clinicalRiskTier', 'clinicalRationale']
    },
    plan: {
      type: Type.OBJECT,
      properties: {
        medicationsPrescribed: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              dosage: { type: Type.STRING },
              frequency: { type: Type.STRING },
              duration: { type: Type.STRING },
              instructions: { type: Type.STRING }
            },
            required: ['name', 'dosage', 'frequency']
          }
        },
        diagnosticOrders: { type: Type.ARRAY, items: { type: Type.STRING } },
        patientEducation: { type: Type.ARRAY, items: { type: Type.STRING } },
        followUp: { type: Type.STRING },
        redFlagWarnings: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['medicationsPrescribed', 'diagnosticOrders', 'patientEducation', 'followUp', 'redFlagWarnings']
    }
  },
  required: ['subjective', 'objective', 'assessment', 'plan']
};

export class GeminiClient {
  private readonly client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'omniscribe-health/1.0' } },
    });
  }

  async generateContent(prompt: string, model: string): Promise<string> {
    try {
      const response = await this.client.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: soapResponseSchema,
        },
      });
      return response.text ?? '';
    } catch (err) {
      throw new ProviderError(`Gemini API call failed: ${(err as Error).message}`, err);
    }
  }
}
