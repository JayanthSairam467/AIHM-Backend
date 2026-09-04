import type { Request, Response, NextFunction } from 'express';
import type { GetSoapNote } from '../../application/use-cases/index.js';

export class SoapController {
  constructor(private readonly getSoapNoteUC: GetSoapNote) {}

  async getSoapNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.getSoapNoteUC.execute(req.params.sessionId!);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
