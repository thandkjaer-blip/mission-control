import type { JsonlRecord, SessionIndexEntry } from './types.js';

export type SessionKind = 'main' | 'subagent' | 'subagent-pool';

export function detectSessionKind(sessionKey: string, entry: SessionIndexEntry, firstUserMessage: string | null): SessionKind {
  if (sessionKey.includes(':subagent:')) return 'subagent';
  if (sessionKey.includes(':subagents:')) return 'subagent-pool';
  if (typeof entry.label === 'string' && /subagent/i.test(entry.label)) return 'subagent';
  if (firstUserMessage && /\[Subagent Context\]/i.test(firstUserMessage)) return 'subagent';
  return 'main';
}

export function extractParentSessionKey(sessionKey: string): string | null {
  if (sessionKey.includes(':subagent:')) return 'agent:main:main';
  if (sessionKey.includes(':subagents:')) return 'agent:main:main';
  return null;
}

export function extractSubagentTask(firstUserMessage: string | null) {
  if (!firstUserMessage) return null;
  const match = firstUserMessage.match(/\[Subagent Task\]:\s*([\s\S]+)/i);
  if (!match) return null;
  return match[1].trim() || null;
}

export function countAssistantToolCalls(records: JsonlRecord[]) {
  let count = 0;
  for (const record of records) {
    if (record.type !== 'message' || record.message?.role !== 'assistant') continue;
    for (const item of record.message?.content ?? []) {
      if (item.type === 'toolCall') count += 1;
    }
  }
  return count;
}
