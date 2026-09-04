export class DomainError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, public readonly details: Array<{ field: string; message: string }> = []) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super(`${resource} with id '${id}' not found`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class DependencyError extends DomainError {
  constructor(service: string, message: string) {
    super(`Dependency '${service}' failed: ${message}`, 'DEPENDENCY_ERROR');
    this.name = 'DependencyError';
  }
}

export class QueueError extends DomainError {
  constructor(queue: string, message: string) {
    super(`Queue '${queue}' error: ${message}`, 'QUEUE_ERROR');
    this.name = 'QueueError';
  }
}

export class ExternalProviderError extends DomainError {
  constructor(provider: string, message: string) {
    super(`External provider '${provider}' error: ${message}`, 'EXTERNAL_PROVIDER_ERROR');
    this.name = 'ExternalProviderError';
  }
}

export class TaskExecutionError extends DomainError {
  constructor(taskId: string, message: string) {
    super(`Task '${taskId}' execution failed: ${message}`, 'TASK_EXECUTION_ERROR');
    this.name = 'TaskExecutionError';
  }
}
