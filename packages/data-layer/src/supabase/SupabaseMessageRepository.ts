import type { SupabaseClient } from '@supabase/supabase-js';
import type { MessageRepository, CreateMessageInput } from '../interfaces/MessageRepository.js';
import type { MessageEntity } from '../types.js';
import { PersistenceError } from './errors.js';

export class SupabaseMessageRepository implements MessageRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(input: CreateMessageInput): Promise<MessageEntity> {
    const { data, error } = await this.supabase
      .from('messages')
      .insert({
        id: input.id,
        session_id: input.sessionId,
        speaker: input.speaker,
        content: input.content,
        sequence_number: input.sequenceNumber,
        category: input.category || null,
      })
      .select()
      .single();

    if (error) {
      throw new PersistenceError(`Failed to create message: ${error.message}`, error);
    }
    return data;
  }

  async findBySessionId(sessionId: string): Promise<MessageEntity[]> {
    const { data, error } = await this.supabase
      .from('messages')
      .select()
      .eq('session_id', sessionId)
      .order('sequence_number', { ascending: true });

    if (error) {
      throw new PersistenceError(`Failed to find messages for session: ${error.message}`, error);
    }
    return data || [];
  }

  async findById(id: string): Promise<MessageEntity | null> {
    const { data, error } = await this.supabase
      .from('messages')
      .select()
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new PersistenceError(`Failed to find message by id: ${error.message}`, error);
    }
    return data;
  }

  async getNextSequenceNumber(sessionId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('messages')
      .select('sequence_number')
      .eq('session_id', sessionId)
      .order('sequence_number', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new PersistenceError(`Failed to get next sequence number: ${error.message}`, error);
    }
    
    return data ? data.sequence_number + 1 : 1;
  }
}
