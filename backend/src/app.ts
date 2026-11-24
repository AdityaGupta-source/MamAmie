import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import { ZodError } from 'zod';
import { config } from './config.js';
import { authRoutes } from './routes/auth.js';
import { meRoutes } from './routes/me.js';
import { syncRoutes } from './routes/sync.js';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string };
    user: { sub: string };
  }
}

export async function buildApp() {
  const app = Fastify({
    logger: config.NODE_ENV === 'test' ? false : { level: 'info', redact: ['req.headers.authorization'] },
    bodyLimit: 1024 * 1024,
    trustProxy: true,
  });

  await app.register(helmet);
  const origins = config.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean);
  await app.register(cors, { origin: origins.length ? origins : false });
  await app.register(rateLimit, { max: config.NODE_ENV === 'test' ? 10_000 : 300, timeWindow: '1 minute' });
  await app.register(jwt, { secret: config.JWT_SECRET });

  app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
    } catch {
      return reply.code(401).send({ error: 'unauthorized', message: 'Missing or expired access token.' });
    }
  });

  app.setErrorHandler((err: unknown, _req, reply) => {
    if (err instanceof ZodError)
      return reply.code(400).send({ error: 'validation_error', message: 'Invalid request.', issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) });
    const e = err as { statusCode?: number; message?: string };
    const status = e.statusCode ?? 500;
    if (status >= 500) app.log.error(err);
    // Never leak internals (or health data) in 5xx responses.
    return reply.code(status).send({ error: status >= 500 ? 'internal_error' : 'request_error', message: status >= 500 ? 'Something went wrong.' : e.message });
  });

  app.get('/health', async () => ({ status: 'ok' }));
  await app.register(authRoutes, { prefix: '/api/v1' });
  await app.register(meRoutes, { prefix: '/api/v1' });
  await app.register(syncRoutes, { prefix: '/api/v1' });
  return app;
}
