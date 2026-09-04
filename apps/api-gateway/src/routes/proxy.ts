import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import type { Request, Response } from 'express';
import _IORedis from 'ioredis';
const IORedis = _IORedis as unknown as typeof _IORedis.default;

const router = Router();

const SCRIBE_SERVICE_URL = process.env.SCRIBE_SERVICE_URL || 'http://localhost:4001';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const GEMINI_SERVICE_URL = process.env.GEMINI_SERVICE_URL || 'http://localhost:4002';
const FHIR_FORMATTER_SERVICE_URL = process.env.FHIR_FORMATTER_SERVICE_URL || 'http://localhost:4003';

const redis = new IORedis(REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy: () => null,
});

async function checkServiceHealth(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/health`, { signal: AbortSignal.timeout(2000) });
    return response.ok;
  } catch (err) {
    return false;
  }
}

router.get('/health', async (req: Request, res: Response): Promise<void> => {
  const [scribeHealthy, geminiHealthy, fhirHealthy] = await Promise.all([
    checkServiceHealth(SCRIBE_SERVICE_URL),
    checkServiceHealth(GEMINI_SERVICE_URL),
    checkServiceHealth(FHIR_FORMATTER_SERVICE_URL),
  ]);

  let redisConnected = false;
  try {
    if (redis.status !== 'ready') {
       await redis.connect().catch(() => {});
    }
    if (redis.status === 'ready') {
      await redis.ping();
      redisConnected = true;
    }
  } catch (err) {
    redisConnected = false;
  }

  const allDependenciesHealthy = scribeHealthy && geminiHealthy && fhirHealthy && redisConnected;
  const criticalDependenciesHealthy = scribeHealthy && redisConnected;

  let status = 'healthy';
  if (!criticalDependenciesHealthy) {
    status = 'unhealthy';
  } else if (!allDependenciesHealthy) {
    status = 'degraded';
  }

  res.json({
    status,
    version: '1.0.0',
    dependencies: {
      supabase: 'connected',
      redis: redisConnected ? 'connected' : 'disconnected',
      gemini: geminiHealthy ? 'configured' : 'unconfigured',
    },
    timestamp: new Date().toISOString(),
  });
});

const scribeProxy = createProxyMiddleware({
  target: SCRIBE_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/scribe': '/scribe',
  },
  on: {
    proxyReq: (proxyReq, req, res) => {
      const correlationId = req.headers['x-correlation-id'] as string;
      if (correlationId) {
        proxyReq.setHeader('x-correlation-id', correlationId);
      }
      fixRequestBody(proxyReq, req);
    },
    error: (err, req, res) => {
      const response = res as Response;
      if (!response.headersSent) {
        response.status(502).json({
          error: {
            code: 'BAD_GATEWAY',
            message: 'Upstream service is unreachable',
            details: [err.message],
          }
        });
      }
    },
  },
});

router.use('/scribe', scribeProxy);

export const proxyRouter = router;
