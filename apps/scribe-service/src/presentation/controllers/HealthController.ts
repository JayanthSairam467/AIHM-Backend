import type { Request, Response } from 'express';

export class HealthController {
  check(req: Request, res: Response): void {
    res.status(200).json({ status: 'ok', service: 'scribe-service' });
  }
}
