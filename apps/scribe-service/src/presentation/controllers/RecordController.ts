import type { Request, Response, NextFunction } from 'express';
import type { GetRecords } from '../../application/use-cases/index.js';

export class RecordController {
  constructor(private readonly getRecordsUC: GetRecords) {}

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.getRecordsUC.execute(req.params.sessionId!);
      res.status(200).json({ records: result });
    } catch (error) {
      next(error);
    }
  }
}
