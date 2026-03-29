import type { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { deterministicUuid } from './ids.js';

const RUNTIME_REFRESH_EVENT_TYPE = 'mission-control.runtime.refresh';
const RUNTIME_REFRESH_SOURCE_ID = 'openclaw-runtime-projector';

export async function recordRuntimeRefresh(app: FastifyInstance, payload: Record<string, unknown>) {
  await app.prisma.event.upsert({
    where: { id: deterministicUuid('event', RUNTIME_REFRESH_SOURCE_ID) },
    update: {
      sourceType: 'mission-control',
      sourceId: RUNTIME_REFRESH_SOURCE_ID,
      eventType: RUNTIME_REFRESH_EVENT_TYPE,
      severity: 'info',
      ts: new Date(),
      message: 'Runtime refresh completed',
      payload: sanitizeJson(payload)
    },
    create: {
      id: deterministicUuid('event', RUNTIME_REFRESH_SOURCE_ID),
      sourceType: 'mission-control',
      sourceId: RUNTIME_REFRESH_SOURCE_ID,
      eventType: RUNTIME_REFRESH_EVENT_TYPE,
      severity: 'info',
      ts: new Date(),
      message: 'Runtime refresh completed',
      payload: sanitizeJson(payload)
    }
  });
}

export async function getLatestRuntimeRefresh(app: FastifyInstance) {
  const event = await app.prisma.event.findFirst({
    where: { sourceType: 'mission-control', eventType: RUNTIME_REFRESH_EVENT_TYPE },
    orderBy: { ts: 'desc' }
  });

  if (!event) return null;

  const payload = (event.payload ?? {}) as Record<string, unknown>;

  return {
    refreshedAt: event.ts.toISOString(),
    workflows: asNumber(payload.workflows),
    agents: asNumber(payload.agents),
    tasks: asNumber(payload.tasks),
    events: asNumber(payload.events),
    indexPath: typeof payload.indexPath === 'string' ? payload.indexPath : null,
    sourceRoot: typeof payload.sourceRoot === 'string' ? payload.sourceRoot : null
  };
}

function asNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function sanitizeJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value, (_key, current) => {
    if (typeof current === 'bigint') return Number(current);
    if (current instanceof Date) return current.toISOString();
    if (current === undefined) return null;
    return current;
  })) as Prisma.InputJsonValue;
}
