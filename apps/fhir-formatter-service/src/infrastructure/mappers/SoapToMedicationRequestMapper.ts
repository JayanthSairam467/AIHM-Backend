import { randomUUID } from 'node:crypto';
import type { FhirMedicationRequest, FormatFhirInput } from '../../domain/types.js';

export class SoapToMedicationRequestMapper {
  map(input: FormatFhirInput, patientId: string, encounterId: string): FhirMedicationRequest[] {
    const plan = input.soapNote.plan as Record<string, any>;
    if (!Array.isArray(plan.medicationsPrescribed)) {
      return [];
    }

    return plan.medicationsPrescribed.map((med: any) => ({
      resourceType: 'MedicationRequest',
      id: randomUUID(),
      status: 'active',
      intent: 'order',
      medicationCodeableConcept: { text: typeof med === 'string' ? med : med.name || 'Unknown Medication' },
      subject: { reference: `urn:uuid:${patientId}` },
      encounter: { reference: `urn:uuid:${encounterId}` },
      dosageInstruction: med.instructions || med.dosage ? [{ text: med.instructions || med.dosage }] : undefined,
    }));
  }
}
