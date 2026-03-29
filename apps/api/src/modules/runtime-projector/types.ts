export type SessionIndexEntry = {
  sessionId: string;
  sessionFile?: string;
  updatedAt?: number;
  startedAt?: number;
  endedAt?: number;
  runtimeMs?: number;
  status?: string;
  label?: string;
  chatType?: string;
  lastChannel?: string;
  deliveryContext?: { channel?: string };
  origin?: Record<string, unknown>;
  [key: string]: unknown;
};

export type JsonlRecord = Record<string, unknown> & {
  type: string;
  id?: string;
  timestamp?: string;
  message?: {
    role?: string;
    content?: Array<Record<string, unknown>>;
  };
};
