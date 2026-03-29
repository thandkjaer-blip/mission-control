import type { AgentStatus, AgentType, PriorityLevel, TaskStatus, TriggerType, WorkflowStatus } from './statuses.js';

export type SortDirection = 'asc' | 'desc';

export type PageQuery = {
  page?: number;
  pageSize?: number;
};

export type AgentsListQuery = PageQuery & {
  status?: AgentStatus;
  type?: AgentType;
  search?: string;
};

export type TasksListQuery = PageQuery & {
  status?: TaskStatus;
  priority?: PriorityLevel;
  agentId?: string;
  workflowId?: string;
};

export type WorkflowsListQuery = PageQuery & {
  status?: WorkflowStatus;
  triggerType?: TriggerType;
  initiatedBy?: string;
};
