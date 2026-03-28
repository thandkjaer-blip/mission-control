export type LiveEventType =
  | 'connection.ready'
  | 'overview.updated'
  | 'agent.updated'
  | 'task.updated'
  | 'workflow.updated'
  | 'alert.updated'
  | 'command.updated'
  | 'provider.updated';

export interface LiveEventEnvelope<TPayload = Record<string, unknown>> {
  type: LiveEventType;
  timestamp: string;
  payload: TPayload;
}
