import { randomUUID } from 'node:crypto';
import type { FhirEncounter, FhirPatient, FhirPractitioner, FormatFhirInput } from '../../domain/types.js';

export class SoapToEncounterMapper {
  map(input: FormatFhirInput, patientId: string, practitionerId: string): FhirEncounter {
    return {
      resourceType: 'Encounter',
      id: randomUUID(),
      status: 'finished',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'AMB',
        display: 'ambulatory',
      },
      subject: { reference: `urn:uuid:${patientId}` },
      participant: [
        { individual: { reference: `urn:uuid:${practitionerId}` } },
      ],
      period: { start: new Date().toISOString() },
    };
  }
}
