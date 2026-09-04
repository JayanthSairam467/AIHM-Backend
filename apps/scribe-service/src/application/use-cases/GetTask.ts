import type { TaskRepository } from '../../infrastructure/repositories/types.js';
import { NotFoundError } from '../../domain/errors/index.js';

export class GetTask {
  constructor(private readonly taskRepo: TaskRepository) {}

  async execute(sessionId: string, taskId: string) {
    const task = await this.taskRepo.findById(taskId);
    if (!task || task.session_id !== sessionId) {
      throw new NotFoundError('Task', taskId);
    }
    return task;
  }
}
