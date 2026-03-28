import type { FastifyPluginAsync } from 'fastify';

const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/healthz', async () => ({ status: 'ok' }));

  app.get('/readyz', async () => ({
    status: 'ready',
    checks: {
      postgres: app.services.postgres,
      redis: app.services.redis,
    },
  }));
};

export default healthRoutes;
