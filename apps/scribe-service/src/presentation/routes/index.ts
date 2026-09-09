import { Router } from 'express';
import { z } from 'zod';
import { validateBody, validateUuidParam } from '../middleware/validateRequest.js';
import type { HealthController } from '../controllers/HealthController.js';
import type { SessionController } from '../controllers/SessionController.js';
import type { MessageController } from '../controllers/MessageController.js';
import type { RecordController } from '../controllers/RecordController.js';
import type { TaskController } from '../controllers/TaskController.js';
import type { SoapController } from '../controllers/SoapController.js';
import type { FhirController } from '../controllers/FhirController.js';
import type { PharmacyController } from '../controllers/PharmacyController.js';

export function createRouter(
  healthController: HealthController,
  sessionController: SessionController,
  messageController: MessageController,
  recordController: RecordController,
  taskController: TaskController,
  soapController: SoapController,
  fhirController: FhirController,
  pharmacyController: PharmacyController
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

  // Pharmacy
  router.post('/scribe/pharmacy/alert', (req, res) => pharmacyController.alertPharmacy(req, res));

  return router;
}
