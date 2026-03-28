import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';

import type { AppEnv } from '../config/env.js';

export interface ServiceStatus {
  postgres: 'ok' | 'degraded';
  redis: 'ok' | 'degraded';
}

declare module 'fastify' {
  interface FastifyInstance {
    appEnv: AppEnv;
    services: ServiceStatus;
  }
}

const plugin: FastifyPluginAsync<{ env: AppEnv }> = async (app, options) => {
  app.decorate('appEnv', options.env);
  app.decorate('services', {
    postgres: 'ok',
    redis: 'ok',
  } satisfies ServiceStatus);
};

export default fp(plugin, { name: 'app-context' });
