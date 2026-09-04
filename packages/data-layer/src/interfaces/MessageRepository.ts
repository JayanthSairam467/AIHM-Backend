import type { MessageEntity } from '../types.js';

export interface CreateMessageInput {
  id: string;
  sessionId: string;
  speaker: MessageEntity['speaker'];
  content: string;
  sequenceNumber: number;
  category?: MessageEntity['category'];
}

export interface MessageRepository {
  create(input: CreateMessageInput): Promise<MessageEntity>;
  findBySessionId(sessionId: string): Promise<MessageEntity[]>;
  findById(id: string): Promise<MessageEntity | null>;
  getNextSequenceNumber(sessionId: string): Promise<number>;
}
