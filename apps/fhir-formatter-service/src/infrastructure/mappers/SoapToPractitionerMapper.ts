import { randomUUID } from 'node:crypto';
import type { FhirPractitioner, FormatFhirInput } from '../../domain/types.js';

export class SoapToPractitionerMapper {
  map(input: FormatFhirInput): FhirPractitioner {
    return {
      resourceType: 'Practitioner',
      id: randomUUID(),
      identifier: input.practitionerId
        ? [{ system: 'http://hl7.org/fhir/sid/us-npi', value: input.practitionerId }]
        : undefined,
      name: [{ text: `Practitioner ${input.practitionerId || 'Unknown'}` }],
    };
  }
}
