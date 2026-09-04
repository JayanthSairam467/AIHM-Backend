import type { SessionRepository, MessageRepository } from '../../infrastructure/repositories/types.js';
import { NotFoundError } from '../../domain/errors/index.js';

export interface MessageOutput {
  id: string;
  sessionId: string;
  speaker: string;
  content: string;
  sequenceNumber: number;
  category: string | null;
  createdAt: string;
}

export class ListMessages {
  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly messageRepo: MessageRepository
  ) {}

  async execute(sessionId: string): Promise<MessageOutput[]> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Session', sessionId);
    }

    const messages = await this.messageRepo.findBySessionId(sessionId);
    
    return messages.map(m => ({
      id: m.id,
      sessionId: m.session_id,
      speaker: m.speaker,
      content: m.content,
      sequenceNumber: m.sequence_number,
      category: m.category,
      createdAt: m.created_at,
    }));
  }
}
