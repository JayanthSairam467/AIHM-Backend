import type { TaskEntity } from '../types.js';

export interface CreateTaskInput {
  id: string;
  sessionId: string;
  taskType: TaskEntity['task_type'];
}

export interface TaskRepository {
  create(input: CreateTaskInput): Promise<TaskEntity>;
  findById(id: string): Promise<TaskEntity | null>;
  findBySessionId(sessionId: string): Promise<TaskEntity[]>;
  updateStatus(id: string, status: TaskEntity['status'], result?: Record<string, unknown>, error?: string): Promise<TaskEntity>;
  markCompleted(id: string, result: Record<string, unknown>): Promise<TaskEntity>;
  markFailed(id: string, error: string): Promise<TaskEntity>;
}
