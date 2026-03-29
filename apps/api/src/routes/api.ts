import type { FastifyPluginAsync } from 'fastify';

import liveRoutes from './api/v1/live.js';
import { getAgent, listAgents } from '../modules/agents/service.js';
import { getOverview } from '../modules/overview/service.js';
import { getTask, listTasks } from '../modules/tasks/service.js';
import { getWorkflow, listWorkflows } from '../modules/workflows/service.js';

export const apiRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/v1/me', async () => {
    const user = await app.prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });

    return user ?? {
      id: 'dev-user-missing',
      email: 'ops@example.com',
      displayName: 'Unseeded Dev User',
      role: 'admin'
    };
  });

  app.get('/api/v1/overview', async () => getOverview(app));
  app.get('/api/v1/agents', async (request) => listAgents(app, request.query as Record<string, unknown>));
  app.get('/api/v1/agents/:agentId', async (request) => getAgent(app, (request.params as { agentId: string }).agentId));
  app.get('/api/v1/tasks', async (request) => listTasks(app, request.query as Record<string, unknown>));
  app.get('/api/v1/tasks/:taskId', async (request) => getTask(app, (request.params as { taskId: string }).taskId));
  app.get('/api/v1/workflows', async (request) => listWorkflows(app, request.query as Record<string, unknown>));
  app.get('/api/v1/workflows/:workflowId', async (request) => getWorkflow(app, (request.params as { workflowId: string }).workflowId));

  await app.register(liveRoutes, { prefix: '/api/v1' });
};
