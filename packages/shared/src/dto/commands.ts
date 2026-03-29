import type { CommandStatus } from '../contracts/statuses.js';
import type { PaginatedResult } from '../contracts/common.js';

export interface SendToJarvisCommandRequest {
  message: string;
  reason?: string;
  mode?: 'default' | 'safe';
  idempotencyKey?: string;
}

export interface CommandAcceptedDto {
  commandId: string;
  status: CommandStatus;
  targetType: string;
  targetId: string;
  queuedAt: string;
  correlationId: string | null;
}

export interface CommandOutcomeDto {
  kind: 'response' | 'error' | 'system' | 'none';
  message: string | null;
  code: string | null;
}

export interface CommandSummaryDto {
  id: string;
  type: string;
  targetType: string;
  targetId: string;
  requestedBy: string;
  requestedAt: string;
  status: CommandStatus;
  approvalRequired: boolean;
  executionStartedAt: string | null;
  executionFinishedAt: string | null;
  updatedAt: string;
  correlationId: string | null;
  summary: string | null;
  durationMs: number | null;
  resultPreview: string | null;
  errorCode: string | null;
  outcome: CommandOutcomeDto;
}

export interface CommandDetailDto extends CommandSummaryDto {
  payload: Record<string, unknown>;
  executionResult: Record<string, unknown> | null;
  error: Record<string, unknown> | null;
}

export type CommandsListDto = PaginatedResult<CommandSummaryDto>;
