import pino from 'pino';

export interface LogContext {
  requestId?: string;
  correlationId?: string;
  sessionId?: string;
  taskId?: string;
  jobId?: string;
}

export function createLogger(serviceName: string, level?: string) {
  return pino({
    name: serviceName,
    level: level || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label) {
        return { level: label };
      },
    },
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie'],
      remove: true,
    },
  });
}

export type Logger = pino.Logger;
