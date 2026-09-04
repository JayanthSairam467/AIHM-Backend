import express from 'express';
import cors from 'cors';
import { GeminiAdapter } from './infrastructure/external/gemini/GeminiAdapter.js';
import { GenerateSoapUseCase } from './application/use-cases/GenerateSoap.js';
import { createRouter } from './presentation/routes/index.js';

async function bootstrap() {
  const port = process.env.GEMINI_SERVICE_PORT || 3002;
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-pro';

  if (!apiKey) {
    console.error('GEMINI_API_KEY environment variable is required');
    process.exit(1);
  }

  const app = express();
  app.use(cors());
  app.use(express.json());

  const scribeModel = new GeminiAdapter(apiKey, model);
  const generateSoapUseCase = new GenerateSoapUseCase(scribeModel);
  const router = createRouter(generateSoapUseCase);

  app.use('/', router);

  app.listen(port, () => {
    console.log(`[gemini-service] Listening on port ${port}`);
    console.log(`[gemini-service] Using model ${model}`);
  });
}

bootstrap().catch((err) => {
  console.error('[gemini-service] Failed to start', err);
  process.exit(1);
});
