import { randomUUID } from 'node:crypto';
import type { FhirComposition, FormatFhirInput, FhirResource } from '../../domain/types.js';

export class SoapToCompositionMapper {
  map(
    input: FormatFhirInput,
    patientId: string,
    practitionerId: string,
    encounterId: string,
    resources: FhirResource[]
  ): FhirComposition {
    const sections = [
      { title: 'Subjective', data: input.soapNote.subjective, code: '111526' },
      { title: 'Objective', data: input.soapNote.objective, code: '111527' },
      { title: 'Assessment', data: input.soapNote.assessment, code: '111528' },
      { title: 'Plan', data: input.soapNote.plan, code: '111529' },
    ];

    return {
      resourceType: 'Composition',
      id: randomUUID(),
      status: 'final',
      type: {
        coding: [{ system: 'http://loinc.org', code: '11488-4', display: 'Consultation note' }],
      },
      subject: { reference: `urn:uuid:${patientId}` },
      encounter: { reference: `urn:uuid:${encounterId}` },
      date: new Date().toISOString(),
      author: [{ reference: `urn:uuid:${practitionerId}` }],
      title: 'Clinical Consultation Note',
      section: sections.map(sec => ({
        title: sec.title,
        code: { coding: [{ system: 'http://loinc.org', code: sec.code, display: sec.title }] },
        text: { status: 'generated', div: `<div xmlns="http://www.w3.org/1999/xhtml"><pre>${JSON.stringify(sec.data, null, 2)}</pre></div>` },
      })),
    };
  }
}
