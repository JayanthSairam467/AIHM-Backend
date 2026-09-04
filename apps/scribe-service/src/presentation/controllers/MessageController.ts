import type { Request, Response, NextFunction } from 'express';
import type { SubmitMessage, ListMessages } from '../../application/use-cases/index.js';

export class MessageController {
  constructor(
    private readonly submitMessageUC: SubmitMessage,
    private readonly listMessagesUC: ListMessages
  ) {}

  async submit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const correlationId = (req.headers['x-correlation-id'] as string) || '';
      const result = await this.submitMessageUC.execute({
        sessionId: req.params.sessionId!,
        ...req.body,
        correlationId
      });
      res.status(202).json(result);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.listMessagesUC.execute(req.params.sessionId!);
      res.status(200).json({ messages: result });
    } catch (error) {
      next(error);
    }
  }
}
