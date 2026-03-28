import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { env } from './config/env';
import { AppError } from './lib/errors';
import { prismaPlugin } from './plugins/prisma';
import { redisPlugin } from './plugins/redis';
import { healthRoutes } from './routes/health';
import { apiRoutes } from './routes/api';

export async function buildApp() {
  const app = Fastify({ logger: { level: env.LOG_LEVEL } });

  await app.register(cors, { origin: true });
  await app.register(websocket);
  await app.register(prismaPlugin);
  await app.register(redisPlugin);
  await app.register(healthRoutes);
  await app.register(apiRoutes);

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send(error.toResponse());
    }

    app.log.error(error);
    return reply.status(500).send({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Unexpected server error' } });
  });

  return app;
}
