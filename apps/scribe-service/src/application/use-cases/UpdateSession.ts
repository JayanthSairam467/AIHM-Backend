import type { SessionRepository } from '../../infrastructure/repositories/types.js';
import { NotFoundError, ConflictError } from '../../domain/errors/index.js';
import { isValidSessionTransition } from '../../domain/value-objects/index.js';
import type { SessionStatus } from '../../domain/value-objects/index.js';
import type { CreateSessionOutput } from './CreateSession.js';

export interface UpdateSessionInput {
  sessionId: string;
  status: SessionStatus;
}

export class UpdateSession {
  constructor(private readonly sessionRepo: SessionRepository) {}

  async execute(input: UpdateSessionInput): Promise<CreateSessionOutput> {
    const session = await this.sessionRepo.findById(input.sessionId);
    if (!session) {
      throw new NotFoundError('Session', input.sessionId);
    }

    if (!isValidSessionTransition(session.status as SessionStatus, input.status)) {
      throw new ConflictError(`Invalid session transition from ${session.status} to ${input.status}`);
    }

    const updated = await this.sessionRepo.updateStatus(input.sessionId, input.status);

    return {
      id: updated.id,
      patientId: updated.patient_id,
      practitionerId: updated.practitioner_id,
      specialty: updated.specialty,
      status: updated.status,
      messageCount: updated.message_count,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };
  }
}
