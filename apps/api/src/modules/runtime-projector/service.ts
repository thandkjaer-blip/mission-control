import { access } from 'node:fs/promises';
import type { FastifyInstance } from 'fastify';
import type { RuntimeRefreshResultDto, RuntimeSourceDto } from '@mission-control/shared';
import { replayOpenClawSessions } from './projector.js';
import { AppError } from '../../lib/errors.js';
import { env } from '../../config/env.js';
import { getLatestRuntimeRefresh, recordRuntimeRefresh } from './refresh-status.js';

async function pathExists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function getRuntimeSourceStatus(app?: FastifyInstance): Promise<RuntimeSourceDto> {
  const indexPath = env.OPENCLAW_SESSION_INDEX_PATH;
  const sourceRoot = env.OPENCLAW_SESSION_SOURCE_ROOT ?? null;

  const status: RuntimeSourceDto = {
    source: 'openclaw',
    refreshEnabled: env.RUNTIME_REFRESH_ENABLED,
    indexPath,
    indexExists: await pathExists(indexPath),
    sourceRoot,
    sourceRootExists: sourceRoot ? await pathExists(sourceRoot) : null,
    configuredVia: {
      indexPath: process.env.OPENCLAW_SESSION_INDEX_PATH ? 'env' : 'default',
      sourceRoot: process.env.OPENCLAW_SESSION_SOURCE_ROOT ? 'env' : 'default'
    },
    lastRefresh: null
  };

  if (!app) return status;

  return {
    ...status,
    lastRefresh: await getLatestRuntimeRefresh(app)
  };
}

export async function refreshRuntimeProjection(app: FastifyInstance): Promise<RuntimeRefreshResultDto> {
  const source = await getRuntimeSourceStatus();

  if (!source.refreshEnabled) {
    throw new AppError(403, 'RUNTIME_REFRESH_DISABLED', 'Runtime refresh is disabled for this Mission Control API instance.');
  }

  if (!source.indexExists) {
    throw new AppError(409, 'RUNTIME_SOURCE_MISSING', 'OpenClaw session index is missing.', { indexPath: source.indexPath });
  }

  if (source.sourceRoot && source.sourceRootExists === false) {
    throw new AppError(409, 'RUNTIME_SOURCE_ROOT_MISSING', 'Configured OpenClaw session source root is missing.', { sourceRoot: source.sourceRoot });
  }

  const summary = await replayOpenClawSessions(app.prisma, {
    indexPath: source.indexPath,
    sourceRoot: source.sourceRoot ?? undefined
  });

  const refreshedAt = new Date().toISOString();

  await recordRuntimeRefresh(app, {
    source: 'openclaw',
    indexPath: source.indexPath,
    sourceRoot: source.sourceRoot,
    ...summary,
    refreshedAt
  });

  const withRefresh = {
    ...source,
    lastRefresh: await getLatestRuntimeRefresh(app)
  };

  return {
    ok: true,
    source: withRefresh,
    ...summary,
    refreshedAt
  };
}
