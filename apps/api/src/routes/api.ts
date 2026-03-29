import type { FastifyPluginAsync } from 'fastify';

import liveRoutes from './api/v1/live.js';
import { getAgent, listAgents } from '../modules/agents/service.js';
import { createSendToJarvisCommand, getCommand, listCommands } from '../modules/commands/service.js';
import { commandListQuerySchema, sendToJarvisRequestSchema } from '../modules/commands/schemas.js';
import { getOverview } from '../modules/overview/service.js';
import { getRuntimeSourceStatus, refreshRuntimeProjection } from '../modules/runtime-projector/service.js';
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
  app.get('/api/v1/commands', async (request) => listCommands(app, commandListQuerySchema.parse(request.query ?? {})));
  app.get('/api/v1/commands/:commandId', async (request) => getCommand(app, (request.params as { commandId: string }).commandId));
  app.get('/api/v1/runtime-source', async () => getRuntimeSourceStatus(app));
  app.post('/api/v1/runtime-source/refresh', async (_request, reply) => {
    const result = await refreshRuntimeProjection(app);
    return reply.status(202).send(result);
  });
  app.post('/api/v1/commands/send-to-jarvis', async (request, reply) => {
    const payload = sendToJarvisRequestSchema.parse(request.body ?? {});
    const user = await app.prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });

    const actor = user
      ? { id: user.id, displayName: user.displayName }
      : { id: 'dev-user-missing', displayName: 'Unseeded Dev User' };

    const accepted = await createSendToJarvisCommand(app, payload, actor, {
      requestId: request.id,
      ipAddress: request.ip
    });

    return reply.status(202).send(accepted);
  });

  await app.register(liveRoutes, { prefix: '/api/v1' });
};
