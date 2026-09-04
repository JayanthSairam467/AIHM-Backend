import type { SessionRepository, SoapNoteRepository } from '../../infrastructure/repositories/types.js';
import { NotFoundError } from '../../domain/errors/index.js';

export class GetSoapNote {
  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly soapNoteRepo: SoapNoteRepository
  ) {}

  async execute(sessionId: string) {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Session', sessionId);
    }

    const note = await this.soapNoteRepo.findLatestBySessionId(sessionId);
    if (!note) {
      throw new NotFoundError('SoapNote for Session', sessionId);
    }

    return note;
  }
}
