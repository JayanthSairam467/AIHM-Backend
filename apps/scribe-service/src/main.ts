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

  const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
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
    console.log(`Scribe service listening on port ${port}`);
  });
}

bootstrap().catch(console.error);
