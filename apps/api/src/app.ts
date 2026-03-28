import Fastify from 'fastify';

import { loadEnv } from './config/env.js';
import { buildLoggerConfig } from './config/logger.js';
import { sendApiError } from './lib/errors.js';
import appContextPlugin from './plugins/app-context.js';
import apiV1Routes from './routes/api/v1/index.js';
import healthRoutes from './routes/health.js';

export const buildApp = () => {
  const env = loadEnv();

  const app = Fastify({
    logger: buildLoggerConfig(env.logLevel),
  });

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    return sendApiError(reply, 500, 'INTERNAL_ERROR', 'Unexpected server error');
  });

  app.register(appContextPlugin, { env });
  app.register(healthRoutes);
  app.register(apiV1Routes, { prefix: '/api/v1' });

  return app;
};
