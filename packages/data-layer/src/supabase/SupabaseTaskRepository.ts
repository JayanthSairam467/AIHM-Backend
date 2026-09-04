import type { SupabaseClient } from '@supabase/supabase-js';
import type { TaskRepository, CreateTaskInput } from '../interfaces/TaskRepository.js';
import type { TaskEntity } from '../types.js';
import { PersistenceError } from './errors.js';

export class SupabaseTaskRepository implements TaskRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(input: CreateTaskInput): Promise<TaskEntity> {
    const { data, error } = await this.supabase
      .from('tasks')
      .insert({
        id: input.id,
        session_id: input.sessionId,
        task_type: input.taskType,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw new PersistenceError(`Failed to create task: ${error.message}`, error);
    }
    return data;
  }

  async findById(id: string): Promise<TaskEntity | null> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select()
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new PersistenceError(`Failed to find task by id: ${error.message}`, error);
    }
    return data;
  }

  async findBySessionId(sessionId: string): Promise<TaskEntity[]> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select()
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new PersistenceError(`Failed to find tasks for session: ${error.message}`, error);
    }
    return data || [];
  }

  async updateStatus(
    id: string,
    status: TaskEntity['status'],
    result?: Record<string, unknown>,
    errorMessage?: string
  ): Promise<TaskEntity> {
    const updates: any = { status };
    if (result !== undefined) updates.result = result;
    if (errorMessage !== undefined) updates.error = errorMessage;
    if (status === 'completed' || status === 'failed') {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new PersistenceError(`Failed to update task status: ${error.message}`, error);
    }
    return data;
  }

  async markCompleted(id: string, result: Record<string, unknown>): Promise<TaskEntity> {
    return this.updateStatus(id, 'completed', result);
  }

  async markFailed(id: string, errorMessage: string): Promise<TaskEntity> {
    return this.updateStatus(id, 'failed', undefined, errorMessage);
  }
}
