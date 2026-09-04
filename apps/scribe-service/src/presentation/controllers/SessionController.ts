import type { Request, Response, NextFunction } from 'express';
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
      const result = await this.getSessionUC.execute(req.params.sessionId!);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.updateSessionUC.execute({
        sessionId: req.params.sessionId!,
        status: req.body.status
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
