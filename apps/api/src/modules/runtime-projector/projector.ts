import { Prisma, PrismaClient } from '@prisma/client';

type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'partial';
type TaskStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'blocked' | 'retrying';
type AgentStatus = 'idle' | 'working' | 'failed' | 'stopped' | 'degraded' | 'starting';
type EventSeverity = 'info' | 'warning' | 'error' | 'critical';
import { readJsonlRecords, readSessionIndex } from './openclaw-source.js';
import { deterministicUuid } from './ids.js';
import { countAssistantToolCalls, detectSessionKind, extractParentSessionKey, extractSubagentTask } from './inspect.js';
import type { JsonlRecord, SessionIndexEntry } from './types.js';

type ReplayOptions = {
  indexPath: string;
  sourceRoot?: string;
};

type WorkflowProjection = {
  workflowId: string;
  agentId: string;
  taskId: string;
  workflow: Prisma.WorkflowUncheckedCreateInput;
  agent: Prisma.AgentUncheckedCreateInput;
  task: Prisma.TaskUncheckedCreateInput;
  events: Prisma.EventUncheckedCreateInput[];
};

export async function replayOpenClawSessions(prisma: PrismaClient, options: ReplayOptions) {
  const sessionEntries = await readSessionIndex(options.indexPath);
  let workflows = 0;
  let agents = 0;
  let tasks = 0;
  let events = 0;

  for (const { sessionKey, entry } of sessionEntries) {
    if (!entry.sessionId) continue;
    const sessionFile = resolveSessionFile(entry, options.sourceRoot);
    if (!sessionFile) continue;

    const records = await readJsonlRecords(sessionFile);
    const projection = buildWorkflowProjection(sessionKey, entry, records);
    if (!projection) continue;

    await prisma.workflow.upsert({
      where: { id: projection.workflowId },
      update: projection.workflow,
      create: projection.workflow
    });
    workflows += 1;

    const { currentTaskId: _ignoredCurrentTaskId, ...agentWithoutCurrentTask } = projection.agent;
    await prisma.agent.upsert({
      where: { id: projection.agentId },
      update: agentWithoutCurrentTask,
      create: agentWithoutCurrentTask
    });
    agents += 1;

    await prisma.task.upsert({
      where: { id: projection.taskId },
      update: projection.task,
      create: projection.task
    });
    tasks += 1;

    await prisma.agent.update({ where: { id: projection.agentId }, data: { currentTaskId: projection.taskId } });

    for (const event of projection.events) {
      await prisma.event.upsert({
        where: { id: event.id },
        update: event,
        create: event
      });
      events += 1;
    }
  }

  return { workflows, agents, tasks, events };
}

function resolveSessionFile(entry: SessionIndexEntry, sourceRoot?: string) {
  if (typeof entry.sessionFile === 'string' && entry.sessionFile) return entry.sessionFile;
  if (sourceRoot && entry.sessionId) return `${sourceRoot.replace(/\/$/, '')}/${entry.sessionId}.jsonl`;
  return null;
}

function buildWorkflowProjection(sessionKey: string, entry: SessionIndexEntry, records: JsonlRecord[]): WorkflowProjection | null {
  const workflowId = deterministicUuid('workflow', entry.sessionId);
  const agentId = deterministicUuid('agent', `${entry.sessionId}:main`);
  const taskId = deterministicUuid('task', `${entry.sessionId}:primary`);
  const firstUserMessage = findFirstUserText(records);
  const firstTs = asDate(records[0]?.timestamp) ?? fromEpoch(entry.startedAt) ?? fromEpoch(entry.updatedAt) ?? new Date();
  const lastTs = lastActivity(records) ?? fromEpoch(entry.endedAt) ?? fromEpoch(entry.updatedAt) ?? firstTs;
  const workflowStatus = mapWorkflowStatus(entry.status, hasErrorEvent(records));
  const sessionKind = detectSessionKind(sessionKey, entry, firstUserMessage);
  const subagentTask = extractSubagentTask(firstUserMessage);
  const taskStatus = mapTaskStatus(workflowStatus);
  const agentStatus = mapAgentStatus(entry.status, workflowStatus);
  const title = deriveTitle(entry, firstUserMessage, subagentTask);
  const channel = typeof entry.deliveryContext?.channel === 'string' ? entry.deliveryContext.channel : entry.lastChannel ?? null;
  const parentSessionKey = extractParentSessionKey(sessionKey);
  const toolCallCount = countAssistantToolCalls(records);

  const workflow: Prisma.WorkflowUncheckedCreateInput = {
    id: workflowId,
    name: title,
    status: workflowStatus,
    triggerType: 'manual',
    initiatedBy: sessionKind === 'subagent' ? 'OpenClaw subagent' : 'OpenClaw session',
    startedAt: firstTs,
    completedAt: isTerminalWorkflowStatus(workflowStatus) ? lastTs : null,
    totalTasks: 1,
    completedTasks: taskStatus === 'completed' ? 1 : 0,
    failedTasks: taskStatus === 'failed' ? 1 : 0,
    totalCostUsd: new Prisma.Decimal(0),
    totalTokens: BigInt(0),
    metadata: sanitizeJson({
      runtime: {
        source: 'openclaw',
        sessionId: entry.sessionId,
        sessionKey,
        sessionFile: entry.sessionFile ?? null,
        channel,
        chatType: entry.chatType ?? null,
        status: entry.status ?? null,
        origin: entry.origin ?? null,
        sessionKind,
        parentSessionKey,
        toolCallCount
      },
      derived: {
        titleDerived: true,
        isHeuristic: true,
        reason: 'Derived from session label or first user message'
      }
    }),
    createdAt: firstTs,
    updatedAt: lastTs
  };

  const agent: Prisma.AgentUncheckedCreateInput = {
    id: agentId,
    name: titleLaneName(entry),
    type: 'runtime',
    version: 'openclaw',
    status: agentStatus,
    health: workflowStatus === 'failed' ? 'critical' : 'healthy',
    currentTaskId: taskId,
    workerId: sessionKey,
    lastHeartbeatAt: lastTs,
    startedAt: firstTs,
    restartCount: 0,
    successRate: new Prisma.Decimal(taskStatus === 'failed' ? 0 : 100),
    avgTaskDurationMs: BigInt(Math.max(0, lastTs.getTime() - firstTs.getTime())),
    totalTasksCompleted: BigInt(taskStatus === 'completed' ? 1 : 0),
    tokenUsageTotal: BigInt(0),
    costTotalUsd: new Prisma.Decimal(0),
    tags: ['openclaw', 'runtime-projector'],
    metadata: sanitizeJson({
      runtime: {
        source: 'openclaw',
        laneType: sessionKind === 'subagent' ? 'subagent' : 'main',
        sessionId: entry.sessionId,
        sessionKey,
        rawStatus: entry.status ?? null,
        parentSessionKey,
        toolCallCount
      },
      derived: {
        role: 'runtime-lane'
      }
    }),
    createdAt: firstTs,
    updatedAt: lastTs
  };

  const task: Prisma.TaskUncheckedCreateInput = {
    id: taskId,
    workflowId,
    assignedAgentId: agentId,
    type: sessionKind === 'subagent' ? 'openclaw-subagent-session' : 'openclaw-session',
    priority: 'normal',
    status: taskStatus,
    title,
    description: subagentTask ?? firstUserMessage ?? 'Projected primary user ask from OpenClaw session.',
    input: sanitizeJson({
      source: 'openclaw',
      firstUserMessage: firstUserMessage ?? null,
      subagentTask: subagentTask ?? null,
      sessionKind,
      parentSessionKey,
      toolCallCount
    }),
    output: Prisma.JsonNull,
    error: workflowStatus === 'failed' ? { reason: 'Session contained error-like events or failed status.' } : Prisma.JsonNull,
    retryCount: 0,
    maxRetries: 0,
    createdBy: 'OpenClaw runtime projector',
    startedAt: firstTs,
    completedAt: isTerminalTaskStatus(taskStatus) ? lastTs : null,
    createdAt: firstTs,
    updatedAt: lastTs
  };

  const events = buildEvents(records, { workflowId, taskId, agentId, sessionId: entry.sessionId, title, lastTs, workflowStatus, sessionKind, subagentTask, toolCallCount });
  return { workflowId, agentId, taskId, workflow, agent, task, events };
}

function buildEvents(records: JsonlRecord[], ctx: { workflowId: string; taskId: string; agentId: string; sessionId: string; title: string; lastTs: Date; workflowStatus: WorkflowStatus; sessionKind: 'main' | 'subagent' | 'subagent-pool'; subagentTask: string | null; toolCallCount: number }) {
  const events: Prisma.EventUncheckedCreateInput[] = [];

  if (ctx.sessionKind === 'subagent') {
    events.push(makeSyntheticEvent(
      `subagent:assignment:${ctx.sessionId}`,
      ctx,
      'openclaw.subagent.spawned',
      'info',
      asDate(records[0]?.timestamp) ?? ctx.lastTs,
      ctx.subagentTask ? `Subagent assignment: ${ctx.subagentTask}` : 'Subagent session projected',
      {
        sessionKind: ctx.sessionKind,
        task: ctx.subagentTask,
        toolCallCount: ctx.toolCallCount
      }
    ));
  }

  for (const record of records) {
    const ts = asDate(record.timestamp) ?? ctx.lastTs;
    if (record.type === 'session') {
      events.push(makeEvent(record, ctx, 'openclaw.session.started', 'info', ts, `Session started: ${ctx.title}`));
      continue;
    }
    if (record.type === 'message') {
      const role = record.message?.role;
      if (role === 'user') {
        events.push(makeEvent(record, ctx, 'openclaw.message.user', 'info', ts, flattenMessageText(record) ?? 'User message received'));
      } else if (role === 'assistant') {
        for (const item of record.message?.content ?? []) {
          if (item.type === 'toolCall') {
            const toolName = typeof item.name === 'string' ? item.name : 'unknown';
            events.push(makeSyntheticEvent(`tool:${record.id}:${String(item.id ?? toolName)}`, ctx, 'openclaw.tool.requested', 'info', ts, `Tool requested: ${toolName}`, {
              toolName,
              toolCallId: item.id ?? null,
              arguments: item.arguments ?? null
            }));
          }
        }
        const assistantText = flattenMessageText(record);
        if (assistantText) {
          events.push(makeEvent(record, ctx, 'openclaw.message.assistant', 'info', ts, assistantText));
        }
      } else if (role === 'toolResult') {
        const text = flattenMessageText(record) ?? 'Tool result received';
        const severity = /error|ENOENT|failed/i.test(text) ? 'error' : 'info';
        events.push(makeEvent(record, ctx, severity === 'error' ? 'openclaw.tool.failed' : 'openclaw.tool.succeeded', severity, ts, text, {
          toolCallId: (record.message as any)?.toolCallId ?? null,
          toolName: (record.message as any)?.toolName ?? null,
          isError: (record.message as any)?.isError ?? null,
          details: (record.message as any)?.details ?? null
        }));
      }
      continue;
    }

    if (record.type === 'model_change' || record.type === 'thinking_level_change' || record.type === 'custom') {
      events.push(makeEvent(record, ctx, `openclaw.${String(record.type)}`, 'info', ts, `${record.type} observed`, record));
    }
  }

  if (ctx.sessionKind === 'subagent' && isTerminalWorkflowStatus(ctx.workflowStatus)) {
    events.push(makeSyntheticEvent(`subagent:end:${ctx.sessionId}`, ctx, ctx.workflowStatus === 'failed' ? 'openclaw.subagent.failed' : 'openclaw.subagent.completed', ctx.workflowStatus === 'failed' ? 'error' : 'info', ctx.lastTs, `Subagent ${ctx.workflowStatus}`, {
      sessionKind: ctx.sessionKind,
      task: ctx.subagentTask,
      toolCallCount: ctx.toolCallCount
    }));
  }

  events.push(makeSyntheticEvent(`session:end:${ctx.sessionId}`, ctx, terminalEventType(ctx.workflowStatus), ctx.workflowStatus === 'failed' ? 'error' : 'info', ctx.lastTs, `Session ${ctx.workflowStatus}`));
  return events;
}

function makeEvent(record: JsonlRecord, ctx: { workflowId: string; taskId: string; agentId: string; sessionId: string }, eventType: string, severity: EventSeverity, ts: Date, message: string, payload?: unknown): Prisma.EventUncheckedCreateInput {
  const id = deterministicUuid('event', `${ctx.sessionId}:${String(record.id ?? `${record.type}:${record.timestamp}`)}:${eventType}`);
  return {
    id,
    sourceType: 'openclaw',
    sourceId: String(record.id ?? ctx.sessionId),
    eventType,
    severity,
    ts,
    correlationId: record.id ?? null,
    workflowId: ctx.workflowId,
    taskId: ctx.taskId,
    agentId: ctx.agentId,
    message: truncate(message),
    payload: sanitizeJson(payload ?? record)
  };
}

function makeSyntheticEvent(seed: string, ctx: { workflowId: string; taskId: string; agentId: string; sessionId: string }, eventType: string, severity: EventSeverity, ts: Date, message: string, payload?: unknown): Prisma.EventUncheckedCreateInput {
  return {
    id: deterministicUuid('event', `${ctx.sessionId}:${seed}:${eventType}`),
    sourceType: 'openclaw',
    sourceId: ctx.sessionId,
    eventType,
    severity,
    ts,
    correlationId: seed,
    workflowId: ctx.workflowId,
    taskId: ctx.taskId,
    agentId: ctx.agentId,
    message: truncate(message),
    payload: sanitizeJson(payload ?? {})
  };
}

function flattenMessageText(record: JsonlRecord): string | null {
  const texts = (record.message?.content ?? [])
    .filter((item) => item.type === 'text')
    .map((item) => (typeof item.text === 'string' ? item.text : ''))
    .filter(Boolean);
  return texts.length ? texts.join('\n\n') : null;
}

function findFirstUserText(records: JsonlRecord[]) {
  for (const record of records) {
    if (record.type === 'message' && record.message?.role === 'user') {
      const text = flattenMessageText(record);
      if (text) return truncate(text, 500);
    }
  }
  return null;
}

function hasErrorEvent(records: JsonlRecord[]) {
  return records.some((record) => {
    if (record.type !== 'message') return false;
    if (record.message?.role !== 'toolResult') return false;
    const text = flattenMessageText(record) ?? '';
    return /error|failed|ENOENT/i.test(text) || (record.message as any)?.isError === true;
  });
}

function lastActivity(records: JsonlRecord[]) {
  for (let i = records.length - 1; i >= 0; i -= 1) {
    const ts = asDate(records[i]?.timestamp);
    if (ts) return ts;
  }
  return null;
}

function titleLaneName(entry: SessionIndexEntry) {
  return typeof entry.label === 'string' && entry.label.trim() ? entry.label.trim() : `OpenClaw ${entry.sessionId.slice(0, 8)}`;
}

function deriveTitle(entry: SessionIndexEntry, firstUserMessage: string | null, subagentTask: string | null) {
  if (typeof entry.label === 'string' && entry.label.trim()) return entry.label.trim();
  if (subagentTask) return truncate(subagentTask.split('\n')[0], 120);
  if (firstUserMessage) return truncate(firstUserMessage.split('\n')[0], 120);
  return `OpenClaw session ${entry.sessionId.slice(0, 8)}`;
}

function mapWorkflowStatus(status: unknown, hasErrors: boolean): WorkflowStatus {
  switch (status) {
    case 'running': return 'running';
    case 'done': return hasErrors ? 'partial' : 'completed';
    case 'error':
    case 'failed': return 'failed';
    case 'cancelled':
    case 'canceled': return 'cancelled';
    default: return hasErrors ? 'failed' : 'pending';
  }
}

function mapTaskStatus(status: WorkflowStatus): TaskStatus {
  switch (status) {
    case 'running': return 'running';
    case 'completed': return 'completed';
    case 'partial': return 'completed';
    case 'failed': return 'failed';
    case 'cancelled': return 'cancelled';
    default: return 'pending';
  }
}

function mapAgentStatus(rawStatus: unknown, workflowStatus: WorkflowStatus): AgentStatus {
  if (rawStatus === 'running') return 'working';
  if (workflowStatus === 'failed') return 'failed';
  if (isTerminalWorkflowStatus(workflowStatus)) return 'stopped';
  return 'idle';
}

function terminalEventType(status: WorkflowStatus) {
  switch (status) {
    case 'completed': return 'openclaw.session.completed';
    case 'partial': return 'openclaw.session.completed';
    case 'failed': return 'openclaw.session.failed';
    case 'cancelled': return 'openclaw.session.failed';
    default: return 'openclaw.session.completed';
  }
}

function isTerminalWorkflowStatus(status: WorkflowStatus) {
  return status === 'completed' || status === 'partial' || status === 'failed' || status === 'cancelled';
}

function isTerminalTaskStatus(status: TaskStatus) {
  return status === 'completed' || status === 'failed' || status === 'cancelled';
}

function asDate(value: unknown) {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function fromEpoch(value: unknown) {
  if (typeof value !== 'number') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function truncate(value: string, max = 2000) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function sanitizeJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value, (_key, current) => {
    if (typeof current === 'bigint') return Number(current);
    if (current instanceof Date) return current.toISOString();
    if (current === undefined) return null;
    return current;
  })) as Prisma.InputJsonValue;
}
