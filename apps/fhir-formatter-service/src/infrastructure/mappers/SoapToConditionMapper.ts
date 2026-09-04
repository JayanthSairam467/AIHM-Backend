import { randomUUID } from 'node:crypto';
import type { FhirCondition, FormatFhirInput } from '../../domain/types.js';

export class SoapToConditionMapper {
  map(input: FormatFhirInput, patientId: string, encounterId: string): FhirCondition[] {
    const conditions: FhirCondition[] = [];
    const assessment = input.soapNote.assessment as Record<string, any>;

    const createCondition = (text: string, code?: string): FhirCondition => ({
      resourceType: 'Condition',
      id: randomUUID(),
      clinicalStatus: {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }],
      },
      code: {
        coding: code ? [{ system: 'http://hl7.org/fhir/sid/icd-10', code, display: text }] : [],
        text,
      },
      subject: { reference: `urn:uuid:${patientId}` },
      encounter: { reference: `urn:uuid:${encounterId}` },
    });

    if (assessment.primaryDiagnosis) {
      conditions.push(createCondition(String(assessment.primaryDiagnosis), assessment.icd10Code ? String(assessment.icd10Code) : undefined));
    }

    if (Array.isArray(assessment.differentialDiagnoses)) {
      for (const diag of assessment.differentialDiagnoses) {
        conditions.push(createCondition(String(diag)));
      }
    }

    return conditions;
  }
}
