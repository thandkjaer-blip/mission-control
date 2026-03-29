import type { FastifyInstance } from 'fastify';
import type { WorkflowDetailDto, WorkflowsListDto } from '@mission-control/shared';
import { AppError } from '../../lib/errors.js';
import { buildPagination, parsePageParams } from '../_shared/pagination.js';
import { bigintToNumber, decimalToNumber, asRecord } from '../_shared/serializers.js';

function mapWorkflow(workflow: any) {
  return {
    id: workflow.id,
    name: workflow.name,
    status: workflow.status,
    triggerType: workflow.triggerType,
    initiatedBy: workflow.initiatedBy,
    totalTasks: workflow.totalTasks,
    completedTasks: workflow.completedTasks,
    failedTasks: workflow.failedTasks,
    totalCostUsd: decimalToNumber(workflow.totalCostUsd),
    totalTokens: bigintToNumber(workflow.totalTokens),
    startedAt: workflow.startedAt?.toISOString() ?? null,
    completedAt: workflow.completedAt?.toISOString() ?? null,
    createdAt: workflow.createdAt.toISOString()
  };
}

export async function listWorkflows(app: FastifyInstance, query: Record<string, unknown>): Promise<WorkflowsListDto> {
  const page = parsePageParams(query);
  const where = {
    ...(typeof query.status === 'string' ? { status: query.status as any } : {}),
    ...(typeof query.triggerType === 'string' ? { triggerType: query.triggerType as any } : {}),
    ...(typeof query.initiatedBy === 'string' && query.initiatedBy.trim()
      ? { initiatedBy: { contains: query.initiatedBy.trim(), mode: 'insensitive' as const } }
      : {})
  };

  const [items, total] = await Promise.all([
    app.prisma.workflow.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      skip: page.skip,
      take: page.pageSize
    }),
    app.prisma.workflow.count({ where })
  ]);

  return {
    items: items.map(mapWorkflow),
    pagination: buildPagination(page.page, page.pageSize, total)
  };
}

export async function getWorkflow(app: FastifyInstance, workflowId: string): Promise<WorkflowDetailDto> {
  const workflow = await app.prisma.workflow.findUnique({
    where: { id: workflowId },
    include: {
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          assignedAgentId: true,
          assignedAgent: { select: { name: true } }
        },
        orderBy: [{ createdAt: 'asc' }]
      }
    }
  });

  if (!workflow) {
    throw new AppError(404, 'NOT_FOUND', 'Workflow not found', { workflowId });
  }

  return {
    ...mapWorkflow(workflow),
    slaClass: workflow.slaClass ?? null,
    metadata: asRecord(workflow.metadata),
    tasks: workflow.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      assignedAgentId: task.assignedAgentId ?? null,
      assignedAgentName: task.assignedAgent?.name ?? null
    }))
  };
}
