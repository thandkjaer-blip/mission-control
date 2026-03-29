import type { TriggerType, WorkflowStatus } from '../contracts/statuses.js';
import type { PaginatedResult } from '../contracts/common.js';

export interface WorkflowSummaryDto {
  id: string;
  name: string;
  status: WorkflowStatus;
  triggerType: TriggerType;
  initiatedBy: string;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalCostUsd: number;
  totalTokens: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface WorkflowDetailDto extends WorkflowSummaryDto {
  slaClass: string | null;
  metadata: Record<string, unknown>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    assignedAgentId: string | null;
    assignedAgentName: string | null;
  }>;
}

export type WorkflowsListDto = PaginatedResult<WorkflowSummaryDto>;
