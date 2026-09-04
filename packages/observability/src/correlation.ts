import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

const CORRELATION_HEADER = 'x-correlation-id';

export function correlationMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (!req.headers[CORRELATION_HEADER]) {
    req.headers[CORRELATION_HEADER] = randomUUID();
  }
  next();
}

export function getCorrelationId(req: Request): string {
  return (req.headers[CORRELATION_HEADER] as string) || randomUUID();
}
