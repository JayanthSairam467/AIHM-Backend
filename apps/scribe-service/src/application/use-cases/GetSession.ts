import type { SessionRepository } from '../../infrastructure/repositories/types.js';
import { NotFoundError } from '../../domain/errors/index.js';
import type { CreateSessionOutput } from './CreateSession.js';

export class GetSession {
  constructor(private readonly sessionRepo: SessionRepository) {}

  async execute(sessionId: string): Promise<CreateSessionOutput> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Session', sessionId);
    }
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
