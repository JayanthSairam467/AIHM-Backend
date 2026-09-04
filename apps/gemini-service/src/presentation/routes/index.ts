import { Router, Request, Response, NextFunction } from 'express';
import { GenerateSoapUseCase } from '../../application/use-cases/GenerateSoap.js';
import { GenerateSoapInput } from '../../application/ports/ClinicalScribeModel.js';
import { ProviderError, ResponseParseError, SoapValidationError } from '../../domain/errors.js';

export function createRouter(generateSoapUseCase: GenerateSoapUseCase): Router {
  const router = Router();

  router.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'healthy', service: 'gemini-service' });
  });

  router.post('/generate-soap', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input: GenerateSoapInput = req.body;
      
      if (!input.transcript) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Transcript is required',
          }
        });
        return;
      }

      const result = await generateSoapUseCase.execute(input);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // Error handler
  router.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    if (error instanceof ProviderError) {
      res.status(502).json({
        error: {
          code: error.code,
          message: error.message,
        }
      });
      return;
    }

    if (error instanceof ResponseParseError) {
      res.status(500).json({
        error: {
          code: error.code,
          message: error.message,
        }
      });
      return;
    }

    if (error instanceof SoapValidationError) {
      res.status(422).json({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        }
      });
      return;
    }

    // Default error
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
      }
    });
  });

  return router;
}
