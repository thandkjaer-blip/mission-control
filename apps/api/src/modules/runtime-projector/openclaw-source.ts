import { readFile } from 'node:fs/promises';
import { SessionIndexEntry, JsonlRecord } from './types.js';

export async function readSessionIndex(indexPath: string): Promise<Array<{ sessionKey: string; entry: SessionIndexEntry }>> {
  const raw = await readFile(indexPath, 'utf8');
  const parsed = JSON.parse(raw) as Record<string, SessionIndexEntry>;
  return Object.entries(parsed).map(([sessionKey, entry]) => ({ sessionKey, entry }));
}

export async function readJsonlRecords(filePath: string): Promise<JsonlRecord[]> {
  const raw = await readFile(filePath, 'utf8');
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as JsonlRecord);
}
