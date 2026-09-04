import { randomUUID } from 'node:crypto';
import type { FhirPatient, FormatFhirInput } from '../../domain/types.js';

export class SoapToPatientMapper {
  map(input: FormatFhirInput): FhirPatient {
    const patientContext = input.patientContext || {};
    let birthDate: string | undefined;

    if (patientContext.age !== undefined) {
      const year = new Date().getFullYear() - patientContext.age;
      birthDate = `${year}-01-01`;
    }

    let gender: string | undefined;
    const sex = patientContext.sex?.toLowerCase();
    if (sex === 'male' || sex === 'm') gender = 'male';
    else if (sex === 'female' || sex === 'f') gender = 'female';
    else if (sex === 'other') gender = 'other';

    return {
      resourceType: 'Patient',
      id: randomUUID(),
      name: patientContext.name ? [{ text: patientContext.name }] : undefined,
      gender,
      birthDate,
      identifier: patientContext.mrn
        ? [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', value: patientContext.mrn }]
        : undefined,
    };
  }
}
