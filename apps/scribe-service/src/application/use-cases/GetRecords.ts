import type { SessionRepository, RecordRepository } from '../../infrastructure/repositories/types.js';
import { NotFoundError } from '../../domain/errors/index.js';

export class GetRecords {
  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly recordRepo: RecordRepository
  ) {}

  async execute(sessionId: string): Promise<any[]> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Session', sessionId);
    }

    const records = await this.recordRepo.findBySessionId(sessionId);
    return records;
  }
}
