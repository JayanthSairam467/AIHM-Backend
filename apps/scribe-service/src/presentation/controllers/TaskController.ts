import type { Request, Response, NextFunction } from 'express';
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
        sessionId: req.params.sessionId!,
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
      const result = await this.getTaskUC.execute(req.params.sessionId!, req.params.taskId!);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
