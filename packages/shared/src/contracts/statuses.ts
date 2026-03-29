export type RoleType = 'admin' | 'operator' | 'viewer' | 'auditor';

export type AgentType = 'programmer' | 'uiux' | 'po' | 'graphic' | 'infra';
export type AgentStatus = 'idle' | 'working' | 'failed' | 'stopped' | 'degraded' | 'starting';
export type HealthStatus = 'healthy' | 'warning' | 'critical';

export type TaskStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'blocked' | 'retrying';
export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'partial';
export type TriggerType = 'manual' | 'schedule' | 'event' | 'api';
export type PriorityLevel = 'low' | 'normal' | 'high' | 'critical';

export type AlertStatus = 'open' | 'acknowledged' | 'resolved' | 'suppressed';
export type CommandStatus = 'pending' | 'approved' | 'executing' | 'succeeded' | 'failed' | 'cancelled';
export type ProviderStatus = 'healthy' | 'degraded' | 'down';
