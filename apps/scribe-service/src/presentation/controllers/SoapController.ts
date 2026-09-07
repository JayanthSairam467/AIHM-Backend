import type { Request, Response, NextFunction } from 'express';
import type { GetSoapNote } from '../../application/use-cases/index.js';
import type { SaveSoapNote } from '../../application/use-cases/SaveSoapNote.js';

export class SoapController {
  constructor(
    private readonly getSoapNoteUC: GetSoapNote,
    private readonly saveSoapNoteUC: SaveSoapNote
  ) {}

  async getSoapNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.getSoapNoteUC.execute(req.params.sessionId!);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async saveSoapNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.saveSoapNoteUC.execute(req.params.sessionId!, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}
