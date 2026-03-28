import type { MeDto } from '@mission-control/shared';
import type { FastifyPluginAsync } from 'fastify';

const meRoutes: FastifyPluginAsync = async (app) => {
  app.get('/me', async (): Promise<MeDto> => ({
    id: 'dev-user-1',
    email: 'ops@example.com',
    displayName: 'Dev Operator',
    role: 'admin',
  }));
};

export default meRoutes;
