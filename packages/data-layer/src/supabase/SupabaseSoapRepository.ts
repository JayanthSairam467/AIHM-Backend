import type { SupabaseClient } from '@supabase/supabase-js';
import type { SoapNoteRepository, CreateSoapNoteInput } from '../interfaces/SoapNoteRepository.js';
import type { SoapNoteEntity } from '../types.js';
import { PersistenceError } from './errors.js';

export class SupabaseSoapRepository implements SoapNoteRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(input: CreateSoapNoteInput): Promise<SoapNoteEntity> {
    const { data, error } = await this.supabase
      .from('soap_notes')
      .insert({
        id: input.id,
        session_id: input.sessionId,
        subjective: input.subjective,
        objective: input.objective,
        assessment: input.assessment,
        plan: input.plan,
        source: input.source,
        version: input.version,
      })
      .select()
      .single();

    if (error) {
      throw new PersistenceError(`Failed to create SOAP note: ${error.message}`, error);
    }
    return data;
  }

  async findLatestBySessionId(sessionId: string): Promise<SoapNoteEntity | null> {
    const { data, error } = await this.supabase
      .from('soap_notes')
      .select()
      .eq('session_id', sessionId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new PersistenceError(`Failed to find latest SOAP note: ${error.message}`, error);
    }
    return data;
  }
}
