import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { ValidationError } from '../../domain/errors/index.js';

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      next(new ValidationError('Request validation failed', details));
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateUuidParam(paramName: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return (req: Request, _res: Response, next: NextFunction): void => {
    const value = req.params[paramName];
    if (!value || !uuidRegex.test(value)) {
      next(new ValidationError(`Invalid UUID for parameter '${paramName}'`, [{ field: paramName, message: 'Must be a valid UUID' }]));
      return;
    }
    next();
  };
}
