import type { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/healthz', async () => ({ status: 'ok' }));

  app.get('/readyz', async () => {
    await app.prisma.$queryRaw`SELECT 1`;
    await app.redis.ping();

    return {
      status: 'ready',
      checks: {
        postgres: 'ok',
        redis: 'ok'
      }
    };
  });
};
