import type { FastifyInstance } from 'fastify';
import type { OverviewDto } from '@mission-control/shared';

import { decimalToNumber } from '../_shared/serializers.js';
import { getLatestRuntimeRefresh } from '../runtime-projector/refresh-status.js';

export async function getOverview(app: FastifyInstance): Promise<OverviewDto> {
  const [agentCounts, taskCounts, workflowCounts, alerts, providerRows, todayCost, burnRate, openclawCounts, latestRuntimeEvent, lastRefresh] = await Promise.all([
    app.prisma.agent.groupBy({ by: ['status'], _count: { _all: true } }),
    app.prisma.task.groupBy({ by: ['status'], _count: { _all: true } }),
    app.prisma.workflow.groupBy({ by: ['status'], _count: { _all: true } }),
    Promise.all([
      app.prisma.alert.count({ where: { status: 'open' } }),
      app.prisma.alert.count({ where: { status: 'open', severity: 'critical' } })
    ]),
    app.prisma.$queryRaw<Array<{ provider: string; status: string }>>`
      SELECT DISTINCT ON (provider) provider, status
      FROM provider_health_snapshots
      ORDER BY provider, ts DESC
    `,
    app.prisma.costRecord.aggregate({
      _sum: { costUsd: true },
      where: { ts: { gte: new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z') } }
    }),
    app.prisma.agentMetricSnapshot.aggregate({ _sum: { costPerHourUsd: true } }),
    Promise.all([
      app.prisma.workflow.count({ where: { metadata: { path: ['runtime', 'source'], equals: 'openclaw' } } }),
      app.prisma.agent.count({ where: { metadata: { path: ['runtime', 'source'], equals: 'openclaw' } } }),
      app.prisma.task.count({ where: { input: { path: ['source'], equals: 'openclaw' } } }),
      app.prisma.agent.count({ where: { metadata: { path: ['runtime', 'laneType'], equals: 'subagent' } } })
    ]),
    app.prisma.event.findFirst({
      where: { sourceType: 'openclaw' },
      orderBy: { ts: 'desc' },
      select: { ts: true }
    }),
    getLatestRuntimeRefresh(app)
  ]);

  const agentMap = Object.fromEntries(agentCounts.map((row) => [row.status, row._count._all]));
  const taskMap = Object.fromEntries(taskCounts.map((row) => [row.status, row._count._all]));
  const workflowMap = Object.fromEntries(workflowCounts.map((row) => [row.status, row._count._all]));

  const providerStatuses = providerRows.map((row) => ({
    name: row.provider,
    status: row.status === 'healthy' || row.status === 'degraded' || row.status === 'down' ? row.status : 'degraded'
  })) as OverviewDto['providers'];

  const infraStatus = providerStatuses.some((provider) => provider.status === 'down')
    ? 'down'
    : providerStatuses.some((provider) => provider.status === 'degraded')
      ? 'degraded'
      : 'healthy';

  return {
    agents: {
      total: Object.values(agentMap).reduce((sum, value) => sum + value, 0),
      idle: agentMap.idle ?? 0,
      working: agentMap.working ?? 0,
      failed: agentMap.failed ?? 0,
      degraded: agentMap.degraded ?? 0
    },
    tasks: {
      pending: (taskMap.pending ?? 0) + (taskMap.queued ?? 0) + (taskMap.blocked ?? 0) + (taskMap.retrying ?? 0),
      running: taskMap.running ?? 0,
      failed24h: await app.prisma.task.count({ where: { status: 'failed', completedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } })
    },
    workflows: {
      running: workflowMap.running ?? 0,
      failed24h: await app.prisma.workflow.count({ where: { status: 'failed', updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } })
    },
    cost: {
      currentBurnRateUsdPerHour: decimalToNumber(burnRate._sum.costPerHourUsd),
      todayUsd: decimalToNumber(todayCost._sum.costUsd)
    },
    infra: {
      status: infraStatus
    },
    alerts: {
      open: alerts[0],
      critical: alerts[1]
    },
    providers: providerStatuses,
    runtime: {
      source: 'openclaw',
      projectedWorkflows: openclawCounts[0],
      projectedAgents: openclawCounts[1],
      projectedTasks: openclawCounts[2],
      subagentAgents: openclawCounts[3],
      latestRuntimeEventAt: latestRuntimeEvent?.ts.toISOString() ?? null,
      lastRefresh
    },
    generatedAt: new Date().toISOString()
  };
}
