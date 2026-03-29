import type { AgentStatus, AgentType, HealthStatus, TaskStatus } from '../contracts/statuses.js';
import type { PaginatedResult } from '../contracts/common.js';

export interface AgentSummaryDto {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  health: HealthStatus;
  version: string;
  currentTaskId: string | null;
  currentTaskTitle: string | null;
  lastHeartbeatAt: string | null;
  startedAt: string | null;
  restartCount: number;
  successRate: number;
  totalTasksCompleted: number;
  costTotalUsd: number;
}

export interface AgentDetailDto extends AgentSummaryDto {
  workerId: string | null;
  avgTaskDurationMs: number;
  tokenUsageTotal: number;
  tags: string[];
  metadata: Record<string, unknown>;
  recentTasks: Array<{
    id: string;
    title: string;
    status: TaskStatus;
    workflowId: string | null;
  }>;
}

export type AgentsListDto = PaginatedResult<AgentSummaryDto>;
