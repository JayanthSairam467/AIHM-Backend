import type { SupabaseClient } from '@supabase/supabase-js';
import type { FhirBundleRepository, CreateFhirBundleInput } from '../interfaces/FhirBundleRepository.js';
import type { FhirBundleEntity } from '../types.js';
import { PersistenceError } from './errors.js';

export class SupabaseFhirRepository implements FhirBundleRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(input: CreateFhirBundleInput): Promise<FhirBundleEntity> {
    const { data, error } = await this.supabase
      .from('fhir_bundles')
      .insert({
        id: input.id,
        session_id: input.sessionId,
        fhir_version: input.fhirVersion,
        resource_count: input.resourceCount,
        bundle: input.bundle,
      })
      .select()
      .single();

    if (error) {
      throw new PersistenceError(`Failed to create FHIR bundle: ${error.message}`, error);
    }
    return data;
  }

  async findBySessionId(sessionId: string): Promise<FhirBundleEntity | null> {
    const { data, error } = await this.supabase
      .from('fhir_bundles')
      .select()
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new PersistenceError(`Failed to find FHIR bundle: ${error.message}`, error);
    }
    return data;
  }
}
