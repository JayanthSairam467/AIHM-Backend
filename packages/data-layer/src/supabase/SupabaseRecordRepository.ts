import type { SupabaseClient } from '@supabase/supabase-js';
import type { RecordRepository, CreateRecordInput } from '../interfaces/RecordRepository.js';
import type { ClinicalRecordEntity } from '../types.js';
import { PersistenceError } from './errors.js';

export class SupabaseRecordRepository implements RecordRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(input: CreateRecordInput): Promise<ClinicalRecordEntity> {
    const { data, error } = await this.supabase
      .from('clinical_records')
      .insert({
        id: input.id,
        session_id: input.sessionId,
        record_type: input.recordType,
        content: input.content,
        source_message_ids: input.sourceMessageIds,
      })
      .select()
      .single();

    if (error) {
      throw new PersistenceError(`Failed to create clinical record: ${error.message}`, error);
    }
    return data;
  }

  async findBySessionId(sessionId: string): Promise<ClinicalRecordEntity[]> {
    const { data, error } = await this.supabase
      .from('clinical_records')
      .select()
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new PersistenceError(`Failed to find records for session: ${error.message}`, error);
    }
    return data || [];
  }
}
