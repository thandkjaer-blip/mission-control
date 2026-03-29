import { formatAgeCompact, type FreshnessState } from '@/lib/freshness';

export function FreshnessBadge({ state }: { state: FreshnessState }) {
  return (
    <span className={`status-badge status-${state.tone}`} title={state.detail}>
      {state.label} · {formatAgeCompact(state.ageMs)}
    </span>
  );
}
