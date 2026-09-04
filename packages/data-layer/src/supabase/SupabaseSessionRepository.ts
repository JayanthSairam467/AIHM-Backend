import type { SupabaseClient } from '@supabase/supabase-js';
import type { SessionRepository, CreateSessionInput } from '../interfaces/SessionRepository.js';
import type { SessionEntity } from '../types.js';
import { PersistenceError } from './errors.js';

export class SupabaseSessionRepository implements SessionRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(input: CreateSessionInput): Promise<SessionEntity> {
    const { data, error } = await this.supabase
      .from('sessions')
      .insert({
        id: input.id,
        patient_id: input.patientId,
        practitioner_id: input.practitionerId,
        specialty: input.specialty || null,
        status: 'active',
        message_count: 0,
        patient_context: input.patientContext || null,
      })
      .select()
      .single();

    if (error) {
      throw new PersistenceError(`Failed to create session: ${error.message}`, error);
    }
    return data;
  }

  async findById(id: string): Promise<SessionEntity | null> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select()
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // not found
      throw new PersistenceError(`Failed to find session by id: ${error.message}`, error);
    }
    return data;
  }

  async updateStatus(id: string, status: SessionEntity['status']): Promise<SessionEntity> {
    const { data, error } = await this.supabase
      .from('sessions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new PersistenceError(`Failed to update session status: ${error.message}`, error);
    }
    return data;
  }

  async incrementMessageCount(id: string): Promise<void> {
    const { error } = await this.supabase.rpc('increment_session_message_count', { session_id: id });
    if (error) {
      // Fallback if RPC doesn't exist
      const { data: session } = await this.supabase.from('sessions').select('message_count').eq('id', id).single();
      if (session) {
        await this.supabase.from('sessions').update({ message_count: session.message_count + 1 }).eq('id', id);
      } else {
        throw new PersistenceError(`Failed to increment message count: ${error.message}`, error);
      }
    }
  }
}
