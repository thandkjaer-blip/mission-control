export const liveEventTypes = [
  'live.connected',
  'overview.updated',
  'agent.updated',
  'task.updated',
  'workflow.updated',
  'alert.updated',
  'command.updated',
  'provider.updated'
] as const;

export type LiveEventType = (typeof liveEventTypes)[number];

export type LiveEventEnvelope<T = unknown> = {
  type: LiveEventType;
  timestamp: string;
  entityId?: string;
  payload: T;
};
