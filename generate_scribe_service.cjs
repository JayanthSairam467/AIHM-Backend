const fs = require('fs');
const path = require('path');

const root = 'c:/Users/test/Desktop/Gowthum workspace/files for use/cts hackathon/omniscribe-backend/apps/scribe-service';

const files = {
  'src/domain/errors/index.ts': `export class DomainError extends Error {
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
    super(\`\${resource} with id '\${id}' not found\`, 'NOT_FOUND');
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
    super(\`Dependency '\${service}' failed: \${message}\`, 'DEPENDENCY_ERROR');
    this.name = 'DependencyError';
  }
}

export class QueueError extends DomainError {
  constructor(queue: string, message: string) {
    super(\`Queue '\${queue}' error: \${message}\`, 'QUEUE_ERROR');
    this.name = 'QueueError';
  }
}

export class ExternalProviderError extends DomainError {
  constructor(provider: string, message: string) {
    super(\`External provider '\${provider}' error: \${message}\`, 'EXTERNAL_PROVIDER_ERROR');
    this.name = 'ExternalProviderError';
  }
}

export class TaskExecutionError extends DomainError {
  constructor(taskId: string, message: string) {
    super(\`Task '\${taskId}' execution failed: \${message}\`, 'TASK_EXECUTION_ERROR');
    this.name = 'TaskExecutionError';
  }
}
`,
  'src/domain/value-objects/index.ts': `export type SessionStatus = 'active' | 'processing' | 'completed' | 'cancelled';
export type Speaker = 'doctor' | 'patient' | 'nurse' | 'system';
export type MessageCategory = 'symptom' | 'medication' | 'vital' | 'diagnosis' | 'general';
export type TaskType = 'generate_soap' | 'export_fhir';
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ClinicalRiskTier = 'Low' | 'Moderate' | 'High' | 'Critical';
export type RecordType = 'transcript' | 'clinical_entity' | 'vital_sign';

const VALID_SESSION_TRANSITIONS: Record<SessionStatus, SessionStatus[]> = {
  active: ['processing', 'completed', 'cancelled'],
  processing: ['completed', 'failed' as SessionStatus, 'active'],
  completed: [],
  cancelled: [],
};

export function isValidSessionTransition(from: SessionStatus, to: SessionStatus): boolean {
  return VALID_SESSION_TRANSITIONS[from]?.includes(to) ?? false;
}
`,
  'src/application/ports/index.ts': `export interface MessageQueuePort {
  enqueueMessage(job: {
    messageId: string;
    sessionId: string;
    speaker: string;
    content: string;
    category?: string;
    sequenceNumber: number;
    correlationId: string;
  }): Promise<string>;
  
  enqueueSoapGeneration(job: {
    taskId: string;
    sessionId: string;
    specialty?: string;
    correlationId: string;
  }): Promise<string>;
  
  enqueueFhirExport(job: {
    taskId: string;
    sessionId: string;
    correlationId: string;
  }): Promise<string>;
}
`,
  'src/application/use-cases/CreateSession.ts': `import { randomUUID } from 'node:crypto';
import type { SessionRepository } from '../../infrastructure/repositories/types.js';
import { ValidationError } from '../../domain/errors/index.js';

export interface CreateSessionInput {
  patientId: string;
  practitionerId: string;
  specialty?: string;
  patientContext?: {
    name?: string;
    age?: number;
    sex?: 'Male' | 'Female' | 'Other';
    mrn?: string;
    allergies?: string[];
    currentMedications?: string[];
  };
}

export interface CreateSessionOutput {
  id: string;
  patientId: string;
  practitionerId: string;
  specialty: string | null;
  status: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export class CreateSession {
  constructor(private readonly sessionRepo: SessionRepository) {}

  async execute(input: CreateSessionInput): Promise<CreateSessionOutput> {
    if (!input.patientId?.trim()) {
      throw new ValidationError('patientId is required', [{ field: 'patientId', message: 'patientId is required' }]);
    }
    if (!input.practitionerId?.trim()) {
      throw new ValidationError('practitionerId is required', [{ field: 'practitionerId', message: 'practitionerId is required' }]);
    }

    const session = await this.sessionRepo.create({
      id: randomUUID(),
      patientId: input.patientId,
      practitionerId: input.practitionerId,
      specialty: input.specialty,
      patientContext: input.patientContext as Record<string, unknown>,
    });

    return {
      id: session.id,
      patientId: session.patient_id,
      practitionerId: session.practitioner_id,
      specialty: session.specialty,
      status: session.status,
      messageCount: session.message_count,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
    };
  }
}
`,
  'src/application/use-cases/GetSession.ts': `import type { SessionRepository } from '../../infrastructure/repositories/types.js';
import { NotFoundError } from '../../domain/errors/index.js';
import type { CreateSessionOutput } from './CreateSession.js';

export class GetSession {
  constructor(private readonly sessionRepo: SessionRepository) {}

  async execute(sessionId: string): Promise<CreateSessionOutput> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Session', sessionId);
    }
    return {
      id: session.id,
      patientId: session.patient_id,
      practitionerId: session.practitioner_id,
      specialty: session.specialty,
      status: session.status,
      messageCount: session.message_count,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
    };
  }
}
`,
  'src/application/use-cases/UpdateSession.ts': `import type { SessionRepository } from '../../infrastructure/repositories/types.js';
import { NotFoundError, ConflictError } from '../../domain/errors/index.js';
import { isValidSessionTransition } from '../../domain/value-objects/index.js';
import type { SessionStatus } from '../../domain/value-objects/index.js';
import type { CreateSessionOutput } from './CreateSession.js';

export interface UpdateSessionInput {
  sessionId: string;
  status: SessionStatus;
}

export class UpdateSession {
  constructor(private readonly sessionRepo: SessionRepository) {}

  async execute(input: UpdateSessionInput): Promise<CreateSessionOutput> {
    const session = await this.sessionRepo.findById(input.sessionId);
    if (!session) {
      throw new NotFoundError('Session', input.sessionId);
    }

    if (!isValidSessionTransition(session.status as SessionStatus, input.status)) {
      throw new ConflictError(\`Invalid session transition from \${session.status} to \${input.status}\`);
    }

    const updated = await this.sessionRepo.updateStatus(input.sessionId, input.status);

    return {
      id: updated.id,
      patientId: updated.patient_id,
      practitionerId: updated.practitioner_id,
      specialty: updated.specialty,
      status: updated.status,
      messageCount: updated.message_count,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };
  }
}
`,
  'src/application/use-cases/SubmitMessage.ts': `import { randomUUID } from 'node:crypto';
import type { SessionRepository, MessageRepository } from '../../infrastructure/repositories/types.js';
import type { MessageQueuePort } from '../ports/index.js';
import { NotFoundError, ConflictError } from '../../domain/errors/index.js';

export interface SubmitMessageInput {
  sessionId: string;
  speaker: string;
  content: string;
  category?: string;
  correlationId: string;
}

export interface SubmitMessageOutput {
  messageId: string;
  jobId: string;
  sequenceNumber: number;
  status: 'queued';
}

export class SubmitMessage {
  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly messageRepo: MessageRepository,
    private readonly queue: MessageQueuePort
  ) {}

  async execute(input: SubmitMessageInput): Promise<SubmitMessageOutput> {
    const session = await this.sessionRepo.findById(input.sessionId);
    if (!session) {
      throw new NotFoundError('Session', input.sessionId);
    }
    if (session.status !== 'active') {
      throw new ConflictError('Cannot submit messages to a non-active session');
    }

    const sequenceNumber = await this.messageRepo.getNextSequenceNumber(input.sessionId);
    const messageId = randomUUID();

    const jobId = await this.queue.enqueueMessage({
      messageId,
      sessionId: input.sessionId,
      speaker: input.speaker,
      content: input.content,
      category: input.category,
      sequenceNumber,
      correlationId: input.correlationId,
    });

    return {
      messageId,
      jobId,
      sequenceNumber,
      status: 'queued',
    };
  }
}
`,
  'src/application/use-cases/ListMessages.ts': `import type { SessionRepository, MessageRepository } from '../../infrastructure/repositories/types.js';
import { NotFoundError } from '../../domain/errors/index.js';

export interface MessageOutput {
  id: string;
  sessionId: string;
  speaker: string;
  content: string;
  sequenceNumber: number;
  category: string | null;
  createdAt: string;
}

export class ListMessages {
  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly messageRepo: MessageRepository
  ) {}

  async execute(sessionId: string): Promise<MessageOutput[]> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Session', sessionId);
    }

    const messages = await this.messageRepo.findBySessionId(sessionId);
    
    return messages.map(m => ({
      id: m.id,
      sessionId: m.session_id,
      speaker: m.speaker,
      content: m.content,
      sequenceNumber: m.sequence_number,
      category: m.category,
      createdAt: m.created_at,
    }));
  }
}
`,
  'src/application/use-cases/GetRecords.ts': `import type { SessionRepository, RecordRepository } from '../../infrastructure/repositories/types.js';
import { NotFoundError } from '../../domain/errors/index.js';

export class GetRecords {
  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly recordRepo: RecordRepository
  ) {}

  async execute(sessionId: string): Promise<any[]> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Session', sessionId);
    }

    const records = await this.recordRepo.findBySessionId(sessionId);
    return records;
  }
}
`,
  'src/application/use-cases/GenerateSoap.ts': `import { randomUUID } from 'node:crypto';
import type { SessionRepository, TaskRepository } from '../../infrastructure/repositories/types.js';
import type { MessageQueuePort } from '../ports/index.js';
import { NotFoundError } from '../../domain/errors/index.js';

export interface GenerateSoapInput {
  sessionId: string;
  specialty?: string;
  correlationId: string;
}

export class GenerateSoap {
  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly taskRepo: TaskRepository,
    private readonly queue: MessageQueuePort
  ) {}

  async execute(input: GenerateSoapInput) {
    const session = await this.sessionRepo.findById(input.sessionId);
    if (!session) {
      throw new NotFoundError('Session', input.sessionId);
    }

    const taskId = randomUUID();
    const task = await this.taskRepo.create({
      id: taskId,
      sessionId: input.sessionId,
      taskType: 'generate_soap'
    });

    const jobId = await this.queue.enqueueSoapGeneration({
      taskId,
      sessionId: input.sessionId,
      specialty: input.specialty,
      correlationId: input.correlationId
    });

    return {
      taskId: task.id,
      jobId,
      status: task.status
    };
  }
}
`,
  'src/application/use-cases/GetTask.ts': `import type { TaskRepository } from '../../infrastructure/repositories/types.js';
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
`,
  'src/application/use-cases/GetSoapNote.ts': `import type { SessionRepository, SoapNoteRepository } from '../../infrastructure/repositories/types.js';
import { NotFoundError } from '../../domain/errors/index.js';

export class GetSoapNote {
  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly soapNoteRepo: SoapNoteRepository
  ) {}

  async execute(sessionId: string) {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Session', sessionId);
    }

    const note = await this.soapNoteRepo.findLatestBySessionId(sessionId);
    if (!note) {
      throw new NotFoundError('SoapNote for Session', sessionId);
    }

    return note;
  }
}
`,
  'src/application/use-cases/ExportFhir.ts': `import { randomUUID } from 'node:crypto';
import type { SessionRepository, SoapNoteRepository, TaskRepository } from '../../infrastructure/repositories/types.js';
import type { MessageQueuePort } from '../ports/index.js';
import { NotFoundError, ConflictError } from '../../domain/errors/index.js';

export interface ExportFhirInput {
  sessionId: string;
  correlationId: string;
}

export class ExportFhir {
  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly soapNoteRepo: SoapNoteRepository,
    private readonly taskRepo: TaskRepository,
    private readonly queue: MessageQueuePort
  ) {}

  async execute(input: ExportFhirInput) {
    const session = await this.sessionRepo.findById(input.sessionId);
    if (!session) {
      throw new NotFoundError('Session', input.sessionId);
    }

    const note = await this.soapNoteRepo.findLatestBySessionId(input.sessionId);
    if (!note) {
      throw new ConflictError('Cannot export FHIR without a generated SOAP note');
    }

    const taskId = randomUUID();
    const task = await this.taskRepo.create({
      id: taskId,
      sessionId: input.sessionId,
      taskType: 'export_fhir'
    });

    const jobId = await this.queue.enqueueFhirExport({
      taskId,
      sessionId: input.sessionId,
      correlationId: input.correlationId
    });

    return {
      taskId: task.id,
      jobId,
      status: task.status
    };
  }
}
`,
  'src/application/use-cases/GetFhirBundle.ts': `import type { SessionRepository, FhirBundleRepository } from '../../infrastructure/repositories/types.js';
import { NotFoundError } from '../../domain/errors/index.js';

export class GetFhirBundle {
  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly fhirBundleRepo: FhirBundleRepository
  ) {}

  async execute(sessionId: string) {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Session', sessionId);
    }

    const bundle = await this.fhirBundleRepo.findBySessionId(sessionId);
    if (!bundle) {
      throw new NotFoundError('FhirBundle for Session', sessionId);
    }

    return bundle;
  }
}
`,
  'src/application/use-cases/index.ts': `export * from './CreateSession.js';
export * from './GetSession.js';
export * from './UpdateSession.js';
export * from './SubmitMessage.js';
export * from './ListMessages.js';
export * from './GetRecords.js';
export * from './GenerateSoap.js';
export * from './GetTask.js';
export * from './GetSoapNote.js';
export * from './ExportFhir.js';
export * from './GetFhirBundle.js';
`,
  'src/infrastructure/repositories/types.ts': `export interface SessionEntity {
  id: string;
  patient_id: string;
  practitioner_id: string;
  specialty: string | null;
  status: 'active' | 'processing' | 'completed' | 'cancelled';
  message_count: number;
  patient_context: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface MessageEntity {
  id: string;
  session_id: string;
  speaker: string;
  content: string;
  sequence_number: number;
  category: string | null;
  created_at: string;
}

export interface ClinicalRecordEntity {
  id: string;
  session_id: string;
  record_type: string;
  content: Record<string, unknown>;
  source_message_ids: string[];
  created_at: string;
}

export interface TaskEntity {
  id: string;
  session_id: string;
  task_type: string;
  status: string;
  result: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface SoapNoteEntity {
  id: string;
  session_id: string;
  subjective: Record<string, unknown>;
  objective: Record<string, unknown>;
  assessment: Record<string, unknown>;
  plan: Record<string, unknown>;
  source: string;
  version: number;
  created_at: string;
}

export interface FhirBundleEntity {
  id: string;
  session_id: string;
  fhir_version: string;
  resource_count: number;
  bundle: Record<string, unknown>;
  created_at: string;
}

export interface SessionRepository {
  create(input: { id: string; patientId: string; practitionerId: string; specialty?: string; patientContext?: Record<string, unknown> }): Promise<SessionEntity>;
  findById(id: string): Promise<SessionEntity | null>;
  updateStatus(id: string, status: SessionEntity['status']): Promise<SessionEntity>;
  incrementMessageCount(id: string): Promise<void>;
}

export interface MessageRepository {
  create(input: { id: string; sessionId: string; speaker: string; content: string; sequenceNumber: number; category?: string | null }): Promise<MessageEntity>;
  findBySessionId(sessionId: string): Promise<MessageEntity[]>;
  findById(id: string): Promise<MessageEntity | null>;
  getNextSequenceNumber(sessionId: string): Promise<number>;
}

export interface RecordRepository {
  create(input: { id: string; sessionId: string; recordType: string; content: Record<string, unknown>; sourceMessageIds: string[] }): Promise<ClinicalRecordEntity>;
  findBySessionId(sessionId: string): Promise<ClinicalRecordEntity[]>;
}

export interface TaskRepository {
  create(input: { id: string; sessionId: string; taskType: string }): Promise<TaskEntity>;
  findById(id: string): Promise<TaskEntity | null>;
  findBySessionId(sessionId: string): Promise<TaskEntity[]>;
  updateStatus(id: string, status: string, result?: Record<string, unknown>, error?: string): Promise<TaskEntity>;
  markCompleted(id: string, result: Record<string, unknown>): Promise<TaskEntity>;
  markFailed(id: string, error: string): Promise<TaskEntity>;
}

export interface SoapNoteRepository {
  create(input: { id: string; sessionId: string; subjective: Record<string, unknown>; objective: Record<string, unknown>; assessment: Record<string, unknown>; plan: Record<string, unknown>; source: string; version: number }): Promise<SoapNoteEntity>;
  findLatestBySessionId(sessionId: string): Promise<SoapNoteEntity | null>;
}

export interface FhirBundleRepository {
  create(input: { id: string; sessionId: string; fhirVersion: string; resourceCount: number; bundle: Record<string, unknown> }): Promise<FhirBundleEntity>;
  findBySessionId(sessionId: string): Promise<FhirBundleEntity | null>;
}
`,
  'src/infrastructure/messaging/ScribeQueueProducer.ts': `import type { MessageQueuePort } from '../../application/ports/index.js';
import { QueueError } from '../../domain/errors/index.js';
import { Queue } from 'bullmq';
import type Redis from 'ioredis';

const QUEUE_NAMES = {
  MESSAGE_INGESTION: 'scribe.message.ingestion',
  SOAP_GENERATION: 'scribe.soap.generation',
  FHIR_EXPORT: 'fhir.export',
} as const;

export class ScribeQueueProducer implements MessageQueuePort {
  private readonly messageQueue: Queue;
  private readonly soapQueue: Queue;
  private readonly fhirQueue: Queue;

  constructor(connection: Redis) {
    this.messageQueue = new Queue(QUEUE_NAMES.MESSAGE_INGESTION, { connection });
    this.soapQueue = new Queue(QUEUE_NAMES.SOAP_GENERATION, { connection });
    this.fhirQueue = new Queue(QUEUE_NAMES.FHIR_EXPORT, { connection });
  }

  async enqueueMessage(job: Parameters<MessageQueuePort['enqueueMessage']>[0]): Promise<string> {
    try {
      const result = await this.messageQueue.add('process-message', job, {
        jobId: job.messageId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      });
      return result.id ?? '';
    } catch (err) {
      throw new QueueError(QUEUE_NAMES.MESSAGE_INGESTION, (err as Error).message);
    }
  }

  async enqueueSoapGeneration(job: Parameters<MessageQueuePort['enqueueSoapGeneration']>[0]): Promise<string> {
    try {
      const result = await this.soapQueue.add('generate-soap', job, {
        jobId: job.taskId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      });
      return result.id ?? '';
    } catch (err) {
      throw new QueueError(QUEUE_NAMES.SOAP_GENERATION, (err as Error).message);
    }
  }

  async enqueueFhirExport(job: Parameters<MessageQueuePort['enqueueFhirExport']>[0]): Promise<string> {
    try {
      const result = await this.fhirQueue.add('export-fhir', job, {
        jobId: job.taskId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      });
      return result.id ?? '';
    } catch (err) {
      throw new QueueError(QUEUE_NAMES.FHIR_EXPORT, (err as Error).message);
    }
  }

  async close(): Promise<void> {
    await Promise.all([
      this.messageQueue.close(),
      this.soapQueue.close(),
      this.fhirQueue.close(),
    ]);
  }
}
`,
  'src/infrastructure/workers/MessageWorker.ts': `import { Worker, type Job } from 'bullmq';
import type Redis from 'ioredis';
import type { MessageRepository, RecordRepository, SessionRepository } from '../repositories/types.js';
import { randomUUID } from 'node:crypto';

export class MessageWorker {
  private worker: Worker;

  constructor(
    connection: Redis,
    private messageRepo: MessageRepository,
    private recordRepo: RecordRepository,
    private sessionRepo: SessionRepository
  ) {
    this.worker = new Worker(
      'scribe.message.ingestion',
      async (job: Job) => {
        const { messageId, sessionId, speaker, content, category, sequenceNumber } = job.data;
        
        // Idempotency check
        const existing = await this.messageRepo.findById(messageId);
        if (existing) return existing;

        const message = await this.messageRepo.create({
          id: messageId,
          sessionId,
          speaker,
          content,
          sequenceNumber,
          category
        });

        await this.recordRepo.create({
          id: randomUUID(),
          sessionId,
          recordType: 'transcript',
          content: { text: content, speaker },
          sourceMessageIds: [messageId]
        });

        await this.sessionRepo.incrementMessageCount(sessionId);
        
        return message;
      },
      { connection }
    );
  }

  async close() {
    await this.worker.close();
  }
}
`,
  'src/infrastructure/workers/SoapWorker.ts': `import { Worker, type Job } from 'bullmq';
import type Redis from 'ioredis';
import type { TaskRepository, RecordRepository, SoapNoteRepository } from '../repositories/types.js';
import { randomUUID } from 'node:crypto';

export class SoapWorker {
  private worker: Worker;

  constructor(
    connection: Redis,
    private taskRepo: TaskRepository,
    private recordRepo: RecordRepository,
    private soapNoteRepo: SoapNoteRepository
  ) {
    this.worker = new Worker(
      'scribe.soap.generation',
      async (job: Job) => {
        const { taskId, sessionId, specialty } = job.data;
        
        await this.taskRepo.updateStatus(taskId, 'processing');

        try {
          const records = await this.recordRepo.findBySessionId(sessionId);
          
          // Call gemini-service HTTP endpoint here (mocked for now)
          const response = await fetch('http://localhost:3001/generate/soap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, specialty, records })
          });
          
          if (!response.ok) throw new Error('Failed to generate SOAP');
          const result = await response.json();

          const note = await this.soapNoteRepo.create({
            id: randomUUID(),
            sessionId,
            subjective: result.subjective,
            objective: result.objective,
            assessment: result.assessment,
            plan: result.plan,
            source: 'gemini',
            version: 1
          });

          await this.taskRepo.markCompleted(taskId, note);
          return note;
        } catch (error: any) {
          await this.taskRepo.markFailed(taskId, error.message);
          throw error;
        }
      },
      { connection }
    );
  }

  async close() {
    await this.worker.close();
  }
}
`,
  'src/infrastructure/workers/FhirWorker.ts': `import { Worker, type Job } from 'bullmq';
import type Redis from 'ioredis';
import type { TaskRepository, SoapNoteRepository, FhirBundleRepository } from '../repositories/types.js';
import { randomUUID } from 'node:crypto';

export class FhirWorker {
  private worker: Worker;

  constructor(
    connection: Redis,
    private taskRepo: TaskRepository,
    private soapNoteRepo: SoapNoteRepository,
    private fhirBundleRepo: FhirBundleRepository
  ) {
    this.worker = new Worker(
      'fhir.export',
      async (job: Job) => {
        const { taskId, sessionId } = job.data;
        
        await this.taskRepo.updateStatus(taskId, 'processing');

        try {
          const note = await this.soapNoteRepo.findLatestBySessionId(sessionId);
          if (!note) throw new Error('No SOAP note found');
          
          // Call fhir-formatter-service HTTP endpoint here (mocked for now)
          const response = await fetch('http://localhost:3002/format/fhir', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, note })
          });
          
          if (!response.ok) throw new Error('Failed to export FHIR');
          const result = await response.json();

          const bundle = await this.fhirBundleRepo.create({
            id: randomUUID(),
            sessionId,
            fhirVersion: '4.0.1',
            resourceCount: result.entry?.length || 0,
            bundle: result
          });

          await this.taskRepo.markCompleted(taskId, { bundleId: bundle.id });
          return bundle;
        } catch (error: any) {
          await this.taskRepo.markFailed(taskId, error.message);
          throw error;
        }
      },
      { connection }
    );
  }

  async close() {
    await this.worker.close();
  }
}
`,
  'src/presentation/middleware/errorHandler.ts': `import type { Request, Response, NextFunction } from 'express';
import { ValidationError, NotFoundError, ConflictError, DependencyError, QueueError } from '../../domain/errors/index.js';

export interface ApiError {
  error: {
    code: string;
    message: string;
    details: Array<{ field?: string; message: string }>;
  };
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ValidationError) {
    res.status(400).json({ error: { code: err.code, message: err.message, details: err.details } });
    return;
  }
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: { code: err.code, message: err.message, details: [] } });
    return;
  }
  if (err instanceof ConflictError) {
    res.status(409).json({ error: { code: err.code, message: err.message, details: [] } });
    return;
  }
  if (err instanceof DependencyError || err instanceof QueueError) {
    res.status(502).json({ error: { code: err.code, message: 'Service temporarily unavailable', details: [] } });
    return;
  }
  // Unknown errors - don't expose internals
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', details: [] } });
}
`,
  'src/presentation/middleware/validateRequest.ts': `import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { ValidationError } from '../../domain/errors/index.js';

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      next(new ValidationError('Request validation failed', details));
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateUuidParam(paramName: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return (req: Request, _res: Response, next: NextFunction): void => {
    const value = req.params[paramName];
    if (!value || !uuidRegex.test(value)) {
      next(new ValidationError(\`Invalid UUID for parameter '\${paramName}'\`, [{ field: paramName, message: 'Must be a valid UUID' }]));
      return;
    }
    next();
  };
}
`,
  'src/presentation/controllers/HealthController.ts': `import type { Request, Response } from 'express';

export class HealthController {
  check(req: Request, res: Response): void {
    res.status(200).json({ status: 'ok', service: 'scribe-service' });
  }
}
`,
  'src/presentation/controllers/SessionController.ts': `import type { Request, Response, NextFunction } from 'express';
import type { CreateSession, GetSession, UpdateSession } from '../../application/use-cases/index.js';

export class SessionController {
  constructor(
    private readonly createSessionUC: CreateSession,
    private readonly getSessionUC: GetSession,
    private readonly updateSessionUC: UpdateSession
  ) {}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.createSessionUC.execute(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.getSessionUC.execute(req.params.sessionId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.updateSessionUC.execute({
        sessionId: req.params.sessionId,
        status: req.body.status
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
`,
  'src/presentation/controllers/MessageController.ts': `import type { Request, Response, NextFunction } from 'express';
import type { SubmitMessage, ListMessages } from '../../application/use-cases/index.js';

export class MessageController {
  constructor(
    private readonly submitMessageUC: SubmitMessage,
    private readonly listMessagesUC: ListMessages
  ) {}

  async submit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const correlationId = (req.headers['x-correlation-id'] as string) || '';
      const result = await this.submitMessageUC.execute({
        sessionId: req.params.sessionId,
        ...req.body,
        correlationId
      });
      res.status(202).json(result);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.listMessagesUC.execute(req.params.sessionId);
      res.status(200).json({ messages: result });
    } catch (error) {
      next(error);
    }
  }
}
`,
  'src/presentation/controllers/RecordController.ts': `import type { Request, Response, NextFunction } from 'express';
import type { GetRecords } from '../../application/use-cases/index.js';

export class RecordController {
  constructor(private readonly getRecordsUC: GetRecords) {}

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.getRecordsUC.execute(req.params.sessionId);
      res.status(200).json({ records: result });
    } catch (error) {
      next(error);
    }
  }
}
`,
  'src/presentation/controllers/TaskController.ts': `import type { Request, Response, NextFunction } from 'express';
import type { GenerateSoap, GetTask } from '../../application/use-cases/index.js';

export class TaskController {
  constructor(
    private readonly generateSoapUC: GenerateSoap,
    private readonly getTaskUC: GetTask
  ) {}

  async generateSoap(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const correlationId = (req.headers['x-correlation-id'] as string) || '';
      const result = await this.generateSoapUC.execute({
        sessionId: req.params.sessionId,
        specialty: req.body.specialty,
        correlationId
      });
      res.status(202).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.getTaskUC.execute(req.params.sessionId, req.params.taskId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
`,
  'src/presentation/controllers/SoapController.ts': `import type { Request, Response, NextFunction } from 'express';
import type { GetSoapNote } from '../../application/use-cases/index.js';

export class SoapController {
  constructor(private readonly getSoapNoteUC: GetSoapNote) {}

  async getSoapNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.getSoapNoteUC.execute(req.params.sessionId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
`,
  'src/presentation/controllers/FhirController.ts': `import type { Request, Response, NextFunction } from 'express';
import type { ExportFhir, GetFhirBundle } from '../../application/use-cases/index.js';

export class FhirController {
  constructor(
    private readonly exportFhirUC: ExportFhir,
    private readonly getFhirBundleUC: GetFhirBundle
  ) {}

  async exportFhir(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const correlationId = (req.headers['x-correlation-id'] as string) || '';
      const result = await this.exportFhirUC.execute({
        sessionId: req.params.sessionId,
        correlationId
      });
      res.status(202).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getFhirBundle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.getFhirBundleUC.execute(req.params.sessionId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
`,
  'src/presentation/routes/index.ts': `import { Router } from 'express';
import { z } from 'zod';
import { validateBody, validateUuidParam } from '../middleware/validateRequest.js';
import type { HealthController } from '../controllers/HealthController.js';
import type { SessionController } from '../controllers/SessionController.js';
import type { MessageController } from '../controllers/MessageController.js';
import type { RecordController } from '../controllers/RecordController.js';
import type { TaskController } from '../controllers/TaskController.js';
import type { SoapController } from '../controllers/SoapController.js';
import type { FhirController } from '../controllers/FhirController.js';

export function createRouter(
  healthController: HealthController,
  sessionController: SessionController,
  messageController: MessageController,
  recordController: RecordController,
  taskController: TaskController,
  soapController: SoapController,
  fhirController: FhirController
): Router {
  const router = Router();

  const createSessionSchema = z.object({
    patientId: z.string().min(1),
    practitionerId: z.string().min(1),
    specialty: z.string().optional(),
    patientContext: z.object({
      name: z.string().optional(),
      age: z.number().optional(),
      sex: z.enum(['Male', 'Female', 'Other']).optional(),
      mrn: z.string().optional(),
      allergies: z.array(z.string()).optional(),
      currentMedications: z.array(z.string()).optional()
    }).optional()
  });

  const updateSessionSchema = z.object({
    status: z.enum(['active', 'processing', 'completed', 'cancelled'])
  });

  const submitMessageSchema = z.object({
    speaker: z.string().min(1),
    content: z.string().min(1),
    category: z.string().optional()
  });

  const generateSoapSchema = z.object({
    specialty: z.string().optional()
  });

  // Health
  router.get('/health', (req, res) => healthController.check(req, res));

  // Sessions
  router.post('/scribe/sessions', validateBody(createSessionSchema), (req, res, next) => sessionController.create(req, res, next));
  router.get('/scribe/sessions/:sessionId', validateUuidParam('sessionId'), (req, res, next) => sessionController.get(req, res, next));
  router.patch('/scribe/sessions/:sessionId', validateUuidParam('sessionId'), validateBody(updateSessionSchema), (req, res, next) => sessionController.update(req, res, next));

  // Messages
  router.post('/scribe/sessions/:sessionId/messages', validateUuidParam('sessionId'), validateBody(submitMessageSchema), (req, res, next) => messageController.submit(req, res, next));
  router.get('/scribe/sessions/:sessionId/messages', validateUuidParam('sessionId'), (req, res, next) => messageController.list(req, res, next));

  // Records
  router.get('/scribe/sessions/:sessionId/records', validateUuidParam('sessionId'), (req, res, next) => recordController.get(req, res, next));

  // Tasks
  router.post('/scribe/sessions/:sessionId/tasks/generate-soap', validateUuidParam('sessionId'), validateBody(generateSoapSchema), (req, res, next) => taskController.generateSoap(req, res, next));
  router.get('/scribe/sessions/:sessionId/tasks/:taskId', validateUuidParam('sessionId'), validateUuidParam('taskId'), (req, res, next) => taskController.getTask(req, res, next));

  // SOAP
  router.get('/scribe/sessions/:sessionId/soap', validateUuidParam('sessionId'), (req, res, next) => soapController.getSoapNote(req, res, next));

  // FHIR
  router.post('/scribe/sessions/:sessionId/fhir/export', validateUuidParam('sessionId'), (req, res, next) => fhirController.exportFhir(req, res, next));
  router.get('/scribe/sessions/:sessionId/fhir', validateUuidParam('sessionId'), (req, res, next) => fhirController.getFhirBundle(req, res, next));

  return router;
}
`,
  'src/main.ts': `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import Redis from 'ioredis';

import { createRouter } from './presentation/routes/index.js';
import { errorHandler } from './presentation/middleware/errorHandler.js';

import { HealthController } from './presentation/controllers/HealthController.js';
import { SessionController } from './presentation/controllers/SessionController.js';
import { MessageController } from './presentation/controllers/MessageController.js';
import { RecordController } from './presentation/controllers/RecordController.js';
import { TaskController } from './presentation/controllers/TaskController.js';
import { SoapController } from './presentation/controllers/SoapController.js';
import { FhirController } from './presentation/controllers/FhirController.js';

import {
  CreateSession, GetSession, UpdateSession,
  SubmitMessage, ListMessages,
  GetRecords,
  GenerateSoap, GetTask,
  GetSoapNote,
  ExportFhir, GetFhirBundle
} from './application/use-cases/index.js';

import { ScribeQueueProducer } from './infrastructure/messaging/ScribeQueueProducer.js';
import { MessageWorker } from './infrastructure/workers/MessageWorker.js';
import { SoapWorker } from './infrastructure/workers/SoapWorker.js';
import { FhirWorker } from './infrastructure/workers/FhirWorker.js';

// Mock Repositories (would be injected normally from DB)
const mockSessionRepo: any = {};
const mockMessageRepo: any = {};
const mockRecordRepo: any = {};
const mockTaskRepo: any = {};
const mockSoapNoteRepo: any = {};
const mockFhirBundleRepo: any = {};

async function bootstrap() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.use((req, res, next) => {
    req.headers['x-correlation-id'] = req.headers['x-correlation-id'] || Date.now().toString();
    next();
  });

  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  const queueProducer = new ScribeQueueProducer(redis);

  // Usecases
  const createSessionUC = new CreateSession(mockSessionRepo);
  const getSessionUC = new GetSession(mockSessionRepo);
  const updateSessionUC = new UpdateSession(mockSessionRepo);
  const submitMessageUC = new SubmitMessage(mockSessionRepo, mockMessageRepo, queueProducer);
  const listMessagesUC = new ListMessages(mockSessionRepo, mockMessageRepo);
  const getRecordsUC = new GetRecords(mockSessionRepo, mockRecordRepo);
  const generateSoapUC = new GenerateSoap(mockSessionRepo, mockTaskRepo, queueProducer);
  const getTaskUC = new GetTask(mockTaskRepo);
  const getSoapNoteUC = new GetSoapNote(mockSessionRepo, mockSoapNoteRepo);
  const exportFhirUC = new ExportFhir(mockSessionRepo, mockSoapNoteRepo, mockTaskRepo, queueProducer);
  const getFhirBundleUC = new GetFhirBundle(mockSessionRepo, mockFhirBundleRepo);

  // Controllers
  const healthController = new HealthController();
  const sessionController = new SessionController(createSessionUC, getSessionUC, updateSessionUC);
  const messageController = new MessageController(submitMessageUC, listMessagesUC);
  const recordController = new RecordController(getRecordsUC);
  const taskController = new TaskController(generateSoapUC, getTaskUC);
  const soapController = new SoapController(getSoapNoteUC);
  const fhirController = new FhirController(exportFhirUC, getFhirBundleUC);

  // Routes
  const router = createRouter(
    healthController,
    sessionController,
    messageController,
    recordController,
    taskController,
    soapController,
    fhirController
  );
  
  app.use('/', router);
  app.use(errorHandler);

  // Workers
  const messageWorker = new MessageWorker(redis, mockMessageRepo, mockRecordRepo, mockSessionRepo);
  const soapWorker = new SoapWorker(redis, mockTaskRepo, mockRecordRepo, mockSoapNoteRepo);
  const fhirWorker = new FhirWorker(redis, mockTaskRepo, mockSoapNoteRepo, mockFhirBundleRepo);

  const port = process.env.SCRIBE_SERVICE_PORT || 3000;
  app.listen(port, () => {
    console.log(\`Scribe service listening on port \${port}\`);
  });
}

bootstrap().catch(console.error);
`
};

for (const [relPath, content] of Object.entries(files)) {
  const fullPath = path.join(root, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}
