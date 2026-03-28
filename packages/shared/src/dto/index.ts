import type {
  AgentStatus,
  AlertStatus,
  CommandStatus,
  RoleType,
  TaskStatus,
  WorkflowStatus
} from '../contracts/common';

export type MeDto = {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  environment: 'local' | 'staging' | 'prod';
};

export type OverviewDto = {
  generatedAt: string;
  liveStatus: 'connected' | 'degraded' | 'disconnected';
  agents: { total: number; idle: number; working: number; degraded: number; failed: number };
  tasks: { queued: number; running: number; blocked: number; failed24h: number };
  workflows: { running: number; failed24h: number };
  alerts: { open: number; critical: number };
  commands: { pending: number; executing: number };
};

export type AgentSummaryDto = { id: string; name: string; status: AgentStatus; currentTaskId?: string; heartbeatAt?: string };
export type AgentDetailDto = AgentSummaryDto & { type: string; recentError?: string };
export type TaskSummaryDto = { id: string; name: string; status: TaskStatus; workflowId?: string; agentId?: string };
export type TaskDetailDto = TaskSummaryDto & { priority: 'low' | 'normal' | 'high'; retries: number };
export type WorkflowSummaryDto = { id: string; name: string; status: WorkflowStatus; initiatedBy?: string };
export type WorkflowDetailDto = WorkflowSummaryDto & { triggerType: 'manual' | 'schedule' | 'event' };
export type AlertDto = { id: string; title: string; severity: 'warning' | 'critical'; status: AlertStatus; sourceType: string; sourceId: string };
export type CommandDto = { id: string; type: string; status: CommandStatus; targetType: string; targetId: string; requestedBy: string };
