import { z } from 'zod';

export const roleSchema = z.enum(['viewer', 'operator', 'admin', 'auditor']);
export type RoleType = z.infer<typeof roleSchema>;

export const statusSchema = {
  agent: z.enum(['idle', 'working', 'degraded', 'failed', 'offline']),
  task: z.enum(['queued', 'running', 'blocked', 'succeeded', 'failed', 'cancelled']),
  workflow: z.enum(['queued', 'running', 'paused', 'succeeded', 'failed', 'cancelled']),
  alert: z.enum(['open', 'acknowledged', 'resolved', 'suppressed']),
  command: z.enum(['pending', 'executing', 'succeeded', 'failed', 'cancelled'])
} as const;

export type AgentStatus = z.infer<typeof statusSchema.agent>;
export type TaskStatus = z.infer<typeof statusSchema.task>;
export type WorkflowStatus = z.infer<typeof statusSchema.workflow>;
export type AlertStatus = z.infer<typeof statusSchema.alert>;
export type CommandStatus = z.infer<typeof statusSchema.command>;

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional()
  })
});
export type ApiError = z.infer<typeof apiErrorSchema>;

export const paginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative()
});
export type Pagination = z.infer<typeof paginationSchema>;

export type PaginatedResult<T> = {
  items: T[];
  pagination: Pagination;
};
