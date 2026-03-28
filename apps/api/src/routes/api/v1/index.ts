import type { FastifyPluginAsync } from 'fastify';

import liveRoutes from './live.js';
import meRoutes from './me.js';
import overviewRoutes from './overview.js';

const apiV1Routes: FastifyPluginAsync = async (app) => {
  await app.register(meRoutes);
  await app.register(overviewRoutes);
  await app.register(liveRoutes);
};

export default apiV1Routes;
