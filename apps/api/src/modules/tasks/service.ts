import type { FastifyInstance } from 'fastify';
import type { TaskDetailDto, TasksListDto } from '@mission-control/shared';
import { AppError } from '../../lib/errors.js';
import { buildPagination, parsePageParams } from '../_shared/pagination.js';
import { asRecord, maybeRecord } from '../_shared/serializers.js';

function mapTask(task: any) {
  return {
    id: task.id,
    title: task.title,
    type: task.type,
    status: task.status,
    priority: task.priority,
    workflowId: task.workflow?.id ?? task.workflowId ?? null,
    workflowName: task.workflow?.name ?? null,
    agentId: task.assignedAgent?.id ?? task.assignedAgentId ?? null,
    agentName: task.assignedAgent?.name ?? null,
    retryCount: task.retryCount,
    createdAt: task.createdAt.toISOString(),
    startedAt: task.startedAt?.toISOString() ?? null,
    completedAt: task.completedAt?.toISOString() ?? null
  };
}

export async function listTasks(app: FastifyInstance, query: Record<string, unknown>): Promise<TasksListDto> {
  const page = parsePageParams(query);
  const where = {
    ...(typeof query.status === 'string' ? { status: query.status as any } : {}),
    ...(typeof query.priority === 'string' ? { priority: query.priority as any } : {}),
    ...(typeof query.agentId === 'string' ? { assignedAgentId: query.agentId } : {}),
    ...(typeof query.workflowId === 'string' ? { workflowId: query.workflowId } : {})
  };

  const [items, total] = await Promise.all([
    app.prisma.task.findMany({
      where,
      include: {
        workflow: { select: { id: true, name: true } },
        assignedAgent: { select: { id: true, name: true } }
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      skip: page.skip,
      take: page.pageSize
    }),
    app.prisma.task.count({ where })
  ]);

  return {
    items: items.map(mapTask),
    pagination: buildPagination(page.page, page.pageSize, total)
  };
}

export async function getTask(app: FastifyInstance, taskId: string): Promise<TaskDetailDto> {
  const task = await app.prisma.task.findUnique({
    where: { id: taskId },
    include: {
      workflow: { select: { id: true, name: true } },
      assignedAgent: { select: { id: true, name: true } },
      dependencies: {
        include: { dependsOnTask: { select: { id: true, title: true, status: true } } }
      },
      dependedOnBy: {
        include: { task: { select: { id: true, title: true, status: true } } }
      }
    }
  });

  if (!task) {
    throw new AppError(404, 'NOT_FOUND', 'Task not found', { taskId });
  }

  return {
    ...mapTask(task),
    description: task.description,
    createdBy: task.createdBy,
    maxRetries: task.maxRetries,
    dueAt: task.dueAt?.toISOString() ?? null,
    parentTaskId: task.parentTaskId ?? null,
    input: asRecord(task.input),
    output: maybeRecord(task.output),
    error: maybeRecord(task.error),
    dependencies: task.dependencies.map((dependency) => ({
      taskId: dependency.dependsOnTask.id,
      title: dependency.dependsOnTask.title,
      status: dependency.dependsOnTask.status,
      dependencyType: dependency.dependencyType
    })),
    dependents: task.dependedOnBy.map((dependent) => ({
      taskId: dependent.task.id,
      title: dependent.task.title,
      status: dependent.task.status,
      dependencyType: dependent.dependencyType
    }))
  };
}
