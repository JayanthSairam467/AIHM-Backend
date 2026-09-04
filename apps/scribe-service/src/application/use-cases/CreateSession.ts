import { randomUUID } from 'node:crypto';
import type { SessionRepository } from '../../infrastructure/repositories/types.js';
import { ValidationError } from '../../domain/errors/index.js';

export interface CreateSessionInput {
  patientId: string;
  practitionerId: string;
  specialty?: string;
  patientContext?: {
    name?: string;
    age?: number;
    sex?: 'Male' | 'Female' | 'Other';
    mrn?: string;
    allergies?: string[];
    currentMedications?: string[];
  };
}

export interface CreateSessionOutput {
  id: string;
  patientId: string;
  practitionerId: string;
  specialty: string | null;
  status: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export class CreateSession {
  constructor(private readonly sessionRepo: SessionRepository) {}

  async execute(input: CreateSessionInput): Promise<CreateSessionOutput> {
    if (!input.patientId?.trim()) {
      throw new ValidationError('patientId is required', [{ field: 'patientId', message: 'patientId is required' }]);
    }
    if (!input.practitionerId?.trim()) {
      throw new ValidationError('practitionerId is required', [{ field: 'practitionerId', message: 'practitionerId is required' }]);
    }

    const session = await this.sessionRepo.create({
      id: randomUUID(),
      patientId: input.patientId,
      practitionerId: input.practitionerId,
      specialty: input.specialty,
      patientContext: input.patientContext as Record<string, unknown>,
    });

    return {
      id: session.id,
      patientId: session.patient_id,
      practitionerId: session.practitioner_id,
      specialty: session.specialty,
      status: session.status,
      messageCount: session.message_count,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
    };
  }
}
