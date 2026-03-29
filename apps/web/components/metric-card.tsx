import type { ReactNode } from 'react';

export function MetricCard({
  label,
  value,
  hint,
  tone = 'neutral',
  aside,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: 'neutral' | 'ok' | 'warn' | 'danger';
  aside?: ReactNode;
}) {
  return (
    <section className={`card metric-card metric-card-${tone}`}>
      <div className="metric-card-header">
        <p className="muted metric-label">{label}</p>
        {aside ? <div>{aside}</div> : null}
      </div>
      <div className="metric-value">{value}</div>
      <p className="muted metric-hint">{hint}</p>
    </section>
  );
}
