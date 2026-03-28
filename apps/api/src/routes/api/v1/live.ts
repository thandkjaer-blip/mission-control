import websocket from '@fastify/websocket';
import type { LiveEventEnvelope } from '@mission-control/shared';
import type { FastifyPluginAsync } from 'fastify';

const liveRoutes: FastifyPluginAsync = async (app) => {
  await app.register(websocket);

  app.get('/live', { websocket: true }, (socket) => {
    const connected: LiveEventEnvelope<{ connectionId: string }> = {
      type: 'connection.ready',
      timestamp: new Date().toISOString(),
      payload: {
        connectionId: crypto.randomUUID(),
      },
    };

    socket.send(JSON.stringify(connected));
  });
};

export default liveRoutes;
