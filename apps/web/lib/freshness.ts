export type FreshnessTone = 'ok' | 'warn' | 'danger' | 'neutral';

export type FreshnessState = {
  tone: FreshnessTone;
  label: string;
  detail: string;
  ageMs: number | null;
  isStale: boolean;
};

const minute = 60_000;

export function getFreshnessState(timestamp: string | null | undefined, now = Date.now()): FreshnessState {
  if (!timestamp) {
    return {
      tone: 'warn',
      label: 'Unknown freshness',
      detail: 'No snapshot timestamp received from the API.',
      ageMs: null,
      isStale: true,
    };
  }

  const parsed = new Date(timestamp);
  const ageMs = now - parsed.getTime();

  if (Number.isNaN(parsed.getTime())) {
    return {
      tone: 'warn',
      label: 'Invalid freshness',
      detail: `Could not parse snapshot time: ${timestamp}`,
      ageMs: null,
      isStale: true,
    };
  }

  if (ageMs <= 2 * minute) {
    return {
      tone: 'ok',
      label: 'Fresh snapshot',
      detail: 'Snapshot is recent enough for operator read decisions.',
      ageMs,
      isStale: false,
    };
  }

  if (ageMs <= 10 * minute) {
    return {
      tone: 'warn',
      label: 'Aging snapshot',
      detail: 'Data still looks usable, but refresh before acting on fast-moving issues.',
      ageMs,
      isStale: false,
    };
  }

  return {
    tone: 'danger',
    label: 'Stale snapshot',
    detail: 'Data is old enough that operators should verify before taking action.',
    ageMs,
    isStale: true,
  };
}

export function formatAgeCompact(ageMs: number | null) {
  if (ageMs === null) {
    return 'age unknown';
  }

  if (ageMs < minute) {
    return '<1m old';
  }

  const minutes = Math.round(ageMs / minute);
  if (minutes < 60) {
    return `${minutes}m old`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 48) {
    return `${hours}h old`;
  }

  const days = Math.round(hours / 24);
  return `${days}d old`;
}
