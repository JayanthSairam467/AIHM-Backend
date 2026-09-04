import { randomUUID } from 'node:crypto';
import type { FhirObservation, FormatFhirInput } from '../../domain/types.js';

export class SoapToObservationMapper {
  map(input: FormatFhirInput, patientId: string, encounterId: string): FhirObservation[] {
    const observations: FhirObservation[] = [];
    const objective = input.soapNote.objective as Record<string, any>;

    const createObservation = (name: string, value: string, loinc?: string): FhirObservation => ({
      resourceType: 'Observation',
      id: randomUUID(),
      status: 'final',
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }] }],
      code: {
        coding: loinc ? [{ system: 'http://loinc.org', code: loinc, display: name }] : [],
        text: name,
      },
      subject: { reference: `urn:uuid:${patientId}` },
      encounter: { reference: `urn:uuid:${encounterId}` },
      valueString: value,
    });

    if (objective.vitalSigns) {
      const vitals = objective.vitalSigns as Record<string, any>;
      if (vitals.bloodPressure) observations.push(createObservation('Blood Pressure', String(vitals.bloodPressure), '85354-9'));
      if (vitals.heartRate) observations.push(createObservation('Heart Rate', String(vitals.heartRate), '8867-4'));
      if (vitals.respiratoryRate) observations.push(createObservation('Respiratory Rate', String(vitals.respiratoryRate), '9279-1'));
      if (vitals.temperature) observations.push(createObservation('Temperature', String(vitals.temperature), '8310-5'));
      if (vitals.spO2) observations.push(createObservation('SpO2', String(vitals.spO2), '2708-6'));
      if (vitals.bmi) observations.push(createObservation('BMI', String(vitals.bmi), '39156-5'));
    }

    if (objective.physicalExam) {
      observations.push({
        resourceType: 'Observation',
        id: randomUUID(),
        status: 'final',
        category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'exam', display: 'Exam' }] }],
        code: { text: 'Physical Exam Findings' },
        subject: { reference: `urn:uuid:${patientId}` },
        encounter: { reference: `urn:uuid:${encounterId}` },
        valueString: JSON.stringify(objective.physicalExam),
      });
    }

    return observations;
  }
}
