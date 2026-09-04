import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import _IORedis from 'ioredis';
const IORedis = _IORedis as unknown as typeof _IORedis.default;

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

import {
  createSupabaseClient,
  SupabaseSessionRepository,
  SupabaseMessageRepository,
  SupabaseRecordRepository,
  SupabaseTaskRepository,
  SupabaseSoapRepository,
  SupabaseFhirRepository
} from '@omniscribe/data-layer';

async function bootstrap() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.use((req, res, next) => {
    req.headers['x-correlation-id'] = req.headers['x-correlation-id'] || Date.now().toString();
    next();
  });

  const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  });
  const queueProducer = new ScribeQueueProducer(redis);

  // Initialize Supabase and Repositories
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment.');
  }

  const supabaseClient = createSupabaseClient(supabaseUrl, supabaseKey);
  const sessionRepo = new SupabaseSessionRepository(supabaseClient);
  const messageRepo = new SupabaseMessageRepository(supabaseClient);
  const recordRepo = new SupabaseRecordRepository(supabaseClient);
  const taskRepo = new SupabaseTaskRepository(supabaseClient);
  const soapNoteRepo = new SupabaseSoapRepository(supabaseClient);
  const fhirBundleRepo = new SupabaseFhirRepository(supabaseClient);

  // Usecases
  const createSessionUC = new CreateSession(sessionRepo as any);
  const getSessionUC = new GetSession(sessionRepo as any);
  const updateSessionUC = new UpdateSession(sessionRepo as any);
  const submitMessageUC = new SubmitMessage(sessionRepo as any, messageRepo as any, queueProducer);
  const listMessagesUC = new ListMessages(sessionRepo as any, messageRepo as any);
  const getRecordsUC = new GetRecords(sessionRepo as any, recordRepo as any);
  const generateSoapUC = new GenerateSoap(sessionRepo as any, taskRepo as any, queueProducer);
  const getTaskUC = new GetTask(taskRepo as any);
  const getSoapNoteUC = new GetSoapNote(sessionRepo as any, soapNoteRepo as any);
  const exportFhirUC = new ExportFhir(sessionRepo as any, soapNoteRepo as any, taskRepo as any, queueProducer);
  const getFhirBundleUC = new GetFhirBundle(sessionRepo as any, fhirBundleRepo as any);

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
  const messageWorker = new MessageWorker(redis, messageRepo as any, recordRepo as any, sessionRepo as any);
  const soapWorker = new SoapWorker(redis, taskRepo as any, recordRepo as any, soapNoteRepo as any);
  const fhirWorker = new FhirWorker(redis, taskRepo as any, soapNoteRepo as any, fhirBundleRepo as any);

  const port = process.env.SCRIBE_SERVICE_PORT || 4001;
  app.listen(port, () => {
    console.log(`[Scribe Service] Listening on port ${port}`);
  });
}

bootstrap().catch(console.error);

