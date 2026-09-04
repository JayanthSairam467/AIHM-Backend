import type { Request, Response, NextFunction } from 'express';
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
        sessionId: req.params.sessionId!,
        correlationId
      });
      res.status(202).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getFhirBundle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.getFhirBundleUC.execute(req.params.sessionId!);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
