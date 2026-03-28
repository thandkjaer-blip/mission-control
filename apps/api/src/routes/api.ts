import type { FastifyPluginAsync } from 'fastify';
import type { LiveEventEnvelope, MeDto, OverviewDto } from '@mission-control/shared';

export const apiRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/v1/me', async (): Promise<MeDto> => ({
    id: 'dev-user',
    name: 'Dev Operator',
    email: 'operator@mission-control.local',
    role: 'admin',
    environment: 'local'
  }));

  app.get('/api/v1/overview', async (): Promise<OverviewDto> => ({
    generatedAt: new Date().toISOString(),
    liveStatus: 'connected',
    agents: { total: 4, idle: 1, working: 2, degraded: 1, failed: 0 },
    tasks: { queued: 6, running: 3, blocked: 1, failed24h: 2 },
    workflows: { running: 2, failed24h: 1 },
    alerts: { open: 2, critical: 1 },
    commands: { pending: 1, executing: 1 }
  }));

  app.register(async (wsApp) => {
    wsApp.get('/api/v1/live', { websocket: true }, (socket) => {
      const send = (event: LiveEventEnvelope) => socket.send(JSON.stringify(event));

      send({
        type: 'live.connected',
        timestamp: new Date().toISOString(),
        payload: { status: 'connected' }
      });

      const interval = setInterval(() => {
        send({
          type: 'overview.updated',
          timestamp: new Date().toISOString(),
          payload: { heartbeat: true }
        });
      }, 15000);

      socket.on('close', () => clearInterval(interval));
    });
  });
};
