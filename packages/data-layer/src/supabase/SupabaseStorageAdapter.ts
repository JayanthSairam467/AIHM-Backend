import type { SupabaseClient } from '@supabase/supabase-js';
import type { ArtifactStorage } from '../interfaces/ArtifactStorage.js';
import { PersistenceError } from './errors.js';

export class SupabaseStorageAdapter implements ArtifactStorage {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly bucket: string,
  ) {}

  async uploadJson(path: string, data: unknown): Promise<{ path: string }> {
    const jsonString = JSON.stringify(data, null, 2);
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(path, jsonString, {
        contentType: 'application/json',
        upsert: true,
      });
    if (error) {
      throw new PersistenceError(`Failed to upload artifact to ${path}: ${error.message}`, error);
    }
    return { path };
  }

  async downloadJson<T = unknown>(path: string): Promise<T> {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .download(path);
    if (error) {
      throw new PersistenceError(`Failed to download artifact from ${path}: ${error.message}`, error);
    }
    const text = await data.text();
    return JSON.parse(text) as T;
  }
}
