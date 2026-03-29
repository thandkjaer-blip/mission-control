import { titleCase } from '@/lib/format';

export function StatusBadge({ value }: { value: string }) {
  const tone = getTone(value);

  return <span className={`status-badge status-${tone}`}>{titleCase(value)}</span>;
}

function getTone(value: string) {
  if (['healthy', 'completed', 'idle', 'running', 'succeeded'].includes(value)) {
    return 'ok';
  }

  if (['warning', 'degraded', 'pending', 'queued', 'retrying', 'partial', 'executing', 'approved'].includes(value)) {
    return 'warn';
  }

  if (['failed', 'critical', 'down', 'cancelled', 'blocked', 'stopped'].includes(value)) {
    return 'danger';
  }

  return 'neutral';
}
