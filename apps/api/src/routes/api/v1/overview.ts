import type { OverviewDto } from '@mission-control/shared';
import type { FastifyPluginAsync } from 'fastify';

const overviewRoutes: FastifyPluginAsync = async (app) => {
  app.get('/overview', async (): Promise<OverviewDto> => ({
    agents: {
      total: 0,
      idle: 0,
      working: 0,
      failed: 0,
      degraded: 0,
    },
    tasks: {
      pending: 0,
      running: 0,
      failed24h: 0,
    },
    workflows: {
      running: 0,
      failed24h: 0,
    },
    cost: {
      currentBurnRateUsdPerHour: 0,
      todayUsd: 0,
    },
    infra: {
      status: 'healthy',
    },
    alerts: {
      open: 0,
      critical: 0,
    },
    providers: [],
    runtime: {
      source: 'openclaw',
      projectedWorkflows: 0,
      projectedAgents: 0,
      projectedTasks: 0,
      subagentAgents: 0,
      latestRuntimeEventAt: null,
      lastRefresh: null,
    },
    generatedAt: new Date().toISOString(),
  }));
};

export default overviewRoutes;
