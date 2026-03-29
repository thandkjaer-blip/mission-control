import type { FastifyInstance } from 'fastify';
import type { AgentDetailDto, AgentsListDto } from '@mission-control/shared';
import { AppError } from '../../lib/errors.js';
import { buildPagination, parsePageParams } from '../_shared/pagination.js';
import { bigintToNumber, decimalToNumber, asRecord } from '../_shared/serializers.js';

function mapAgent(agent: any) {
  return {
    id: agent.id,
    name: agent.name,
    type: agent.type,
    status: agent.status,
    health: agent.health,
    version: agent.version,
    currentTaskId: agent.currentTask?.id ?? null,
    currentTaskTitle: agent.currentTask?.title ?? null,
    lastHeartbeatAt: agent.lastHeartbeatAt?.toISOString() ?? null,
    startedAt: agent.startedAt?.toISOString() ?? null,
    restartCount: agent.restartCount,
    successRate: decimalToNumber(agent.successRate),
    totalTasksCompleted: bigintToNumber(agent.totalTasksCompleted),
    costTotalUsd: decimalToNumber(agent.costTotalUsd)
  };
}

export async function listAgents(app: FastifyInstance, query: Record<string, unknown>): Promise<AgentsListDto> {
  const page = parsePageParams(query);
  const where = {
    ...(typeof query.status === 'string' ? { status: query.status as any } : {}),
    ...(typeof query.type === 'string' ? { type: query.type as any } : {}),
    ...(typeof query.search === 'string' && query.search.trim()
      ? {
          OR: [
            { name: { contains: query.search.trim(), mode: 'insensitive' as const } },
            { workerId: { contains: query.search.trim(), mode: 'insensitive' as const } }
          ]
        }
      : {})
  };

  const [items, total] = await Promise.all([
    app.prisma.agent.findMany({
      where,
      include: { currentTask: { select: { id: true, title: true } } },
      orderBy: [{ updatedAt: 'desc' }, { name: 'asc' }],
      skip: page.skip,
      take: page.pageSize
    }),
    app.prisma.agent.count({ where })
  ]);

  return {
    items: items.map(mapAgent),
    pagination: buildPagination(page.page, page.pageSize, total)
  };
}

export async function getAgent(app: FastifyInstance, agentId: string): Promise<AgentDetailDto> {
  const agent = await app.prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      currentTask: { select: { id: true, title: true } },
      assignedTasks: {
        select: { id: true, title: true, status: true, workflowId: true },
        orderBy: [{ updatedAt: 'desc' }],
        take: 5
      }
    }
  });

  if (!agent) {
    throw new AppError(404, 'NOT_FOUND', 'Agent not found', { agentId });
  }

  return {
    ...mapAgent(agent),
    workerId: agent.workerId ?? null,
    avgTaskDurationMs: bigintToNumber(agent.avgTaskDurationMs),
    tokenUsageTotal: bigintToNumber(agent.tokenUsageTotal),
    tags: agent.tags,
    metadata: asRecord(agent.metadata),
    recentTasks: agent.assignedTasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      workflowId: task.workflowId ?? null
    }))
  };
}
