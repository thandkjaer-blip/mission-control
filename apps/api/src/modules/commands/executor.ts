import type { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { asRecord } from '../_shared/serializers.js';
import { commandConstants } from './service.js';
import { sendMessageToJarvis } from './openclaw-adapter.js';

const EXECUTOR_INTERVAL_MS = 2_000;
const EXECUTION_STALE_AFTER_MS = 120_000;

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function serializeExecutionResult(result: Awaited<ReturnType<typeof sendMessageToJarvis>>) {
  return jsonValue({
    accepted: result.accepted,
    summary: result.summary,
    exitCode: result.exitCode,
    signal: result.signal,
    response: result.response ?? null,
    stdout: result.stdout.trim() || null,
    stderr: result.stderr.trim() || null
  });
}

async function failStaleExecutingCommands(app: FastifyInstance) {
  const staleBefore = new Date(Date.now() - EXECUTION_STALE_AFTER_MS);

  await app.prisma.controlCommand.updateMany({
    where: {
      type: commandConstants.SEND_TO_JARVIS_TYPE,
      status: 'executing',
      targetType: commandConstants.JARVIS_TARGET_TYPE,
      targetId: commandConstants.JARVIS_TARGET_ID,
      executionStartedAt: { lt: staleBefore }
    },
    data: {
      status: 'failed',
      executionFinishedAt: new Date(),
      executionResult: jsonValue({
        accepted: false,
        summary: 'Command execution exceeded the executor safety window and was failed automatically.',
        exitCode: null,
        signal: null,
        response: null,
        stdout: null,
        stderr: null
      }),
      error: jsonValue({
        code: 'EXECUTION_STALE',
        message: 'Command execution exceeded the executor safety window and was failed automatically.'
      })
    }
  });
}

async function executeNextPendingCommand(app: FastifyInstance) {
  await failStaleExecutingCommands(app);

  const candidate = await app.prisma.controlCommand.findFirst({
    where: {
      type: commandConstants.SEND_TO_JARVIS_TYPE,
      status: 'pending',
      targetType: commandConstants.JARVIS_TARGET_TYPE,
      targetId: commandConstants.JARVIS_TARGET_ID
    },
    orderBy: [{ requestedAt: 'asc' }, { createdAt: 'asc' }]
  });

  if (!candidate) return;

  const claimed = await app.prisma.controlCommand.updateMany({
    where: { id: candidate.id, status: 'pending' },
    data: { status: 'executing', executionStartedAt: new Date(), error: Prisma.JsonNull }
  });

  if (claimed.count !== 1) return;

  const payload = asRecord(candidate.payload);
  const message = typeof payload.message === 'string' ? payload.message.trim() : '';

  if (!message) {
    await app.prisma.controlCommand.update({
      where: { id: candidate.id },
      data: {
        status: 'failed',
        executionFinishedAt: new Date(),
        executionResult: jsonValue({
          accepted: false,
          summary: 'Command payload is missing a message.',
          exitCode: null,
          signal: null,
          response: null,
          stdout: null,
          stderr: null
        }),
        error: jsonValue({ code: 'INVALID_PAYLOAD', message: 'Command payload is missing a message.' })
      }
    });
    return;
  }

  try {
    const result = await sendMessageToJarvis(message);

    if (result.ok) {
      await app.prisma.controlCommand.update({
        where: { id: candidate.id },
        data: {
          status: 'succeeded',
          executionFinishedAt: new Date(),
          executionResult: serializeExecutionResult(result),
          error: Prisma.JsonNull
        }
      });
      return;
    }

    await app.prisma.controlCommand.update({
      where: { id: candidate.id },
      data: {
        status: 'failed',
        executionFinishedAt: new Date(),
        executionResult: serializeExecutionResult(result),
        error: jsonValue({
          code: result.exitCode == null ? 'OPENCLAW_EXEC_FAILED' : 'OPENCLAW_EXIT_NONZERO',
          message: result.summary,
          exitCode: result.exitCode,
          signal: result.signal,
          stderr: result.stderr.trim() || null
        })
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown executor error';
    await app.prisma.controlCommand.update({
      where: { id: candidate.id },
      data: {
        status: 'failed',
        executionFinishedAt: new Date(),
        error: jsonValue({
          code: 'EXECUTOR_ERROR',
          message
        })
      }
    });

    throw error;
  }
}

export function startCommandExecutor(app: FastifyInstance) {
  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await executeNextPendingCommand(app);
    } catch (error) {
      app.log.error({ err: error }, 'command executor tick failed');
    } finally {
      running = false;
    }
  };

  const interval = setInterval(tick, EXECUTOR_INTERVAL_MS);
  void tick();

  app.addHook('onClose', async () => {
    clearInterval(interval);
  });
}
