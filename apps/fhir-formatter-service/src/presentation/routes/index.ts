import { Router, Request, Response } from 'express';
import { FormatFhirBundle } from '../../application/use-cases/FormatFhirBundle.js';
import { BundleValidationError } from '../../domain/errors.js';

export function createRouter(formatFhirBundle: FormatFhirBundle): Router {
  const router = Router();

  router.post('/format-bundle', (req: Request, res: Response) => {
    try {
      const input = req.body;
      if (!input || !input.soapNote) {
        return res.status(400).json({ error: 'Invalid input: soapNote is required' });
      }

      const bundle = formatFhirBundle.execute(input);
      
      res.json({
        bundle,
        resourceCount: bundle.entry.length
      });
    } catch (error: any) {
      if (error instanceof BundleValidationError) {
        res.status(422).json({ error: error.message, issues: error.issues });
      } else {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Internal Server Error' });
      }
    }
  });

  router.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'healthy', service: 'fhir-formatter-service' });
  });

  return router;
}
