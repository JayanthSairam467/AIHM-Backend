import type { Request, Response, NextFunction } from 'express';

export function gatewayErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  // If response already sent from proxy, skip
  if (res.headersSent) return;
  
  const statusCode = (err as { statusCode?: number }).statusCode || 500;
  res.status(statusCode).json({
    error: {
      code: statusCode === 504 ? 'GATEWAY_TIMEOUT' : 'GATEWAY_ERROR',
      message: statusCode === 504 ? 'Upstream service timed out' : 'An error occurred in the gateway',
      details: [],
    },
  });
}
