import type { PriorityLevel, TaskStatus } from '../contracts/statuses.js';
import type { PaginatedResult } from '../contracts/common.js';

export interface TaskSummaryDto {
  id: string;
  title: string;
  type: string;
  status: TaskStatus;
  priority: PriorityLevel;
  workflowId: string | null;
  workflowName: string | null;
  agentId: string | null;
  agentName: string | null;
  retryCount: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface TaskDetailDto extends TaskSummaryDto {
  description: string;
  createdBy: string;
  maxRetries: number;
  dueAt: string | null;
  parentTaskId: string | null;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error: Record<string, unknown> | null;
  dependencies: Array<{
    taskId: string;
    title: string;
    status: TaskStatus;
    dependencyType: 'hard' | 'soft';
  }>;
  dependents: Array<{
    taskId: string;
    title: string;
    status: TaskStatus;
    dependencyType: 'hard' | 'soft';
  }>;
}

export type TasksListDto = PaginatedResult<TaskSummaryDto>;
