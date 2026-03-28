export type RoleType = 'admin' | 'operator' | 'viewer';
export type AgentStatus = 'idle' | 'working' | 'failed' | 'degraded' | 'offline';
export type TaskStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled';
export type WorkflowStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'paused' | 'cancelled';
export type AlertStatus = 'open' | 'acknowledged' | 'resolved';
export type CommandStatus = 'pending' | 'executing' | 'succeeded' | 'failed' | 'cancelled';
