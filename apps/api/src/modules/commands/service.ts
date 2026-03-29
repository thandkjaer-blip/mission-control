import type { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import type { CommandAcceptedDto, CommandDetailDto, CommandsListDto } from '@mission-control/shared';
import { AppError } from '../../lib/errors.js';
import { buildPagination } from '../_shared/pagination.js';
import { asRecord, maybeRecord } from '../_shared/serializers.js';
import type { CommandListQueryInput, SendToJarvisRequestInput } from './schemas.js';

const SEND_TO_JARVIS_TYPE = 'send-to-jarvis';
const JARVIS_TARGET_TYPE = 'agent';
const JARVIS_TARGET_ID = 'main';

function cleanText(value: unknown, maxLength = 240) {
  if (typeof value !== 'string') return null;
  const compact = value.replace(/\s+/g, ' ').trim();
  if (!compact) return null;
  return compact.length > maxLength ? `${compact.slice(0, maxLength - 1)}…` : compact;
}

function getSummary(payload: Record<string, unknown>, executionResult?: Record<string, unknown> | null, error?: Record<string, unknown> | null) {
  const resultSummary = cleanText(executionResult?.summary, 160);
  if (resultSummary) return resultSummary;
  const errorMessage = cleanText(error?.message, 160);
  if (errorMessage) return errorMessage;
  const message = cleanText(payload.message, 140);
  return message;
}

function getResultPreview(executionResult?: Record<string, unknown> | null, error?: Record<string, unknown> | null) {
  const response = maybeRecord((executionResult?.response ?? null) as Prisma.JsonValue | null);
  const result = maybeRecord((response?.result ?? null) as Prisma.JsonValue | null);
  const payloadsValue = result?.payloads;
  const payloads = Array.isArray(payloadsValue) ? (payloadsValue as Array<Record<string, unknown>>) : [];
  const firstText = payloads.find((item) => typeof item?.text === 'string' && item.text.trim());
  const responseText = cleanText(firstText?.text, 280);
  if (responseText) return responseText;

  const stderrText = cleanText(executionResult?.stderr, 220);
  if (stderrText) return stderrText;

  const errorMessage = cleanText(error?.message, 220);
  if (errorMessage) return errorMessage;

  return null;
}

function getDurationMs(command: {
  requestedAt: Date;
  executionStartedAt: Date | null;
  executionFinishedAt: Date | null;
  status: string;
}) {
  if (command.executionStartedAt && command.executionFinishedAt) {
    return Math.max(0, command.executionFinishedAt.getTime() - command.executionStartedAt.getTime());
  }

  if (command.executionStartedAt && command.status === 'executing') {
    return Math.max(0, Date.now() - command.executionStartedAt.getTime());
  }

  return null;
}

function getOutcome(executionResult?: Record<string, unknown> | null, error?: Record<string, unknown> | null) {
  const errorCode = cleanText(error?.code, 80);
  const errorMessage = cleanText(error?.message, 240);
  if (errorCode || errorMessage) {
    return {
      kind: 'error' as const,
      message: errorMessage,
      code: errorCode
    };
  }

  const preview = getResultPreview(executionResult, error);
  if (preview) {
    return {
      kind: 'response' as const,
      message: preview,
      code: null
    };
  }

  const executionSummary = cleanText(executionResult?.summary, 160);
  if (executionSummary) {
    return {
      kind: 'system' as const,
      message: executionSummary,
      code: null
    };
  }

  return {
    kind: 'none' as const,
    message: null,
    code: null
  };
}

function mapCommand(command: any): CommandDetailDto {
  const payload = asRecord(command.payload);
  const executionResult = maybeRecord(command.executionResult);
  const error = maybeRecord(command.error);
  const outcome = getOutcome(executionResult, error);

  return {
    id: command.id,
    type: command.type,
    targetType: command.targetType,
    targetId: command.targetId,
    requestedBy: command.requestedBy,
    requestedAt: command.requestedAt.toISOString(),
    status: command.status,
    approvalRequired: command.approvalRequired,
    executionStartedAt: command.executionStartedAt?.toISOString() ?? null,
    executionFinishedAt: command.executionFinishedAt?.toISOString() ?? null,
    updatedAt: command.updatedAt.toISOString(),
    correlationId: command.correlationId ?? null,
    summary: getSummary(payload, executionResult, error),
    durationMs: getDurationMs(command),
    resultPreview: getResultPreview(executionResult, error),
    errorCode: outcome.kind === 'error' ? outcome.code : null,
    outcome,
    payload,
    executionResult,
    error
  };
}

export async function listCommands(app: FastifyInstance, query: CommandListQueryInput): Promise<CommandsListDto> {
  const skip = (query.page - 1) * query.pageSize;
  const where = {
    ...(query.targetType ? { targetType: query.targetType } : {}),
    ...(query.targetId ? { targetId: query.targetId } : {}),
    ...(query.type ? { type: query.type } : {}),
    ...(query.status ? { status: query.status } : {})
  };

  const [items, total] = await Promise.all([
    app.prisma.controlCommand.findMany({
      where,
      orderBy: [{ requestedAt: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: query.pageSize
    }),
    app.prisma.controlCommand.count({ where })
  ]);

  return {
    items: items.map((item) => mapCommand(item)),
    pagination: buildPagination(query.page, query.pageSize, total)
  };
}

export async function getCommand(app: FastifyInstance, commandId: string): Promise<CommandDetailDto> {
  const command = await app.prisma.controlCommand.findUnique({ where: { id: commandId } });

  if (!command) {
    throw new AppError(404, 'NOT_FOUND', 'Command not found', { commandId });
  }

  return mapCommand(command);
}

export async function createSendToJarvisCommand(
  app: FastifyInstance,
  input: SendToJarvisRequestInput,
  actor: { id: string; displayName: string },
  requestMeta: { requestId?: string; ipAddress?: string | null }
): Promise<CommandAcceptedDto> {
  if (input.idempotencyKey) {
    const existing = await app.prisma.controlCommand.findFirst({
      where: {
        type: SEND_TO_JARVIS_TYPE,
        targetType: JARVIS_TARGET_TYPE,
        targetId: JARVIS_TARGET_ID,
        requestedBy: actor.displayName,
        correlationId: input.idempotencyKey
      },
      orderBy: { requestedAt: 'desc' }
    });

    if (existing) {
      return {
        commandId: existing.id,
        status: existing.status,
        targetType: existing.targetType,
        targetId: existing.targetId,
        queuedAt: existing.requestedAt.toISOString(),
        correlationId: existing.correlationId ?? null
      };
    }
  }

  const command = await app.prisma.controlCommand.create({
    data: {
      type: SEND_TO_JARVIS_TYPE,
      targetType: JARVIS_TARGET_TYPE,
      targetId: JARVIS_TARGET_ID,
      payload: {
        message: input.message,
        reason: input.reason,
        mode: input.mode,
        source: 'mission-control'
      },
      requestedBy: actor.displayName,
      approvalRequired: false,
      correlationId: input.idempotencyKey ?? requestMeta.requestId ?? crypto.randomUUID()
    }
  });

  await app.prisma.auditLog.create({
    data: {
      actorId: actor.id,
      actorType: 'user',
      action: 'command.requested',
      targetType: 'control_command',
      targetId: command.id,
      requestId: requestMeta.requestId,
      after: { type: command.type, targetType: command.targetType, targetId: command.targetId, status: command.status },
      reason: input.reason,
      result: 'accepted',
      ipAddress: requestMeta.ipAddress ?? undefined
    }
  });

  return {
    commandId: command.id,
    status: command.status,
    targetType: command.targetType,
    targetId: command.targetId,
    queuedAt: command.requestedAt.toISOString(),
    correlationId: command.correlationId ?? null
  };
}

export const commandConstants = {
  SEND_TO_JARVIS_TYPE,
  JARVIS_TARGET_ID,
  JARVIS_TARGET_TYPE
};
