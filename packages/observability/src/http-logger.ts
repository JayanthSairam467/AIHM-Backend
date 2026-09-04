import type { Logger } from './logger.js';
import type { IncomingMessage, ServerResponse } from 'node:http';

// eslint-disable-next-line @typescript-eslint/no-require-imports
export function createHttpLogger(logger: Logger) {
  // Dynamic import approach to handle ESM/CJS interop
  // pino-http is used as middleware, return a no-op if unavailable
  const pinoHttp = require('pino-http');
  const middleware = typeof pinoHttp === 'function' ? pinoHttp : pinoHttp.default;
  return middleware({
    logger,
    autoLogging: {
      ignore: (req: IncomingMessage) => req.url === '/health' || req.url === '/api/v1/health',
    },
    customProps: () => ({}),
    serializers: {
      req(req: IncomingMessage) {
        return {
          method: req.method,
          url: req.url,
        };
      },
      res(res: ServerResponse) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  });
}
