import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { correlationIdMiddleware } from './middleware/correlationId.js';
import { timeoutMiddleware } from './middleware/timeout.js';
import { gatewayErrorHandler } from './middleware/errorHandler.js';
import { proxyRouter } from './routes/proxy.js';

const PORT = parseInt(process.env.API_GATEWAY_PORT || '4000', 10);

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

const app = express();

app.use(correlationIdMiddleware);
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use((pinoHttp as any)({ logger }));
app.use(timeoutMiddleware(30000));

app.use('/api/v1', proxyRouter);

app.use(gatewayErrorHandler);

app.listen(PORT, () => {
  logger.info(`API Gateway started on port ${PORT}`);
});
