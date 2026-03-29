import { getOverview } from '@/lib/api';
import { getFreshnessState } from '@/lib/freshness';
import { getLiveUrl } from '@/lib/live';

export type ShellStatus = {
  liveLabel: string;
  liveTone: 'ok' | 'warn' | 'neutral';
  apiLabel: string;
  apiTone: 'ok' | 'warn' | 'danger';
  operatorLabel: string;
  snapshotAt: string | null;
  freshness: ReturnType<typeof getFreshnessState>;
};

export async function getShellStatus(): Promise<ShellStatus> {
  const liveUrl = getLiveUrl();

  try {
    const overview = await getOverview();

    return {
      liveLabel: liveUrl.includes('/api/v1/live') ? 'live stream staged' : 'live stream configured',
      liveTone: liveUrl.includes('localhost') ? 'warn' : 'ok',
      apiLabel: 'api reachable',
      apiTone: 'ok',
      operatorLabel: 'role: operator',
      snapshotAt: overview.generatedAt,
      freshness: getFreshnessState(overview.generatedAt),
    };
  } catch {
    return {
      liveLabel: 'live stream unavailable',
      liveTone: 'neutral',
      apiLabel: 'api unreachable',
      apiTone: 'danger',
      operatorLabel: 'role: operator',
      snapshotAt: null,
      freshness: getFreshnessState(null),
    };
  }
}
