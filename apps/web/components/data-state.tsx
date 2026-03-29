import type { ReactNode } from 'react';

const toneMeta = {
  neutral: { label: 'Info', className: 'data-state-neutral' },
  info: { label: 'Heads-up', className: 'data-state-info' },
  loading: { label: 'Loading', className: 'data-state-loading' },
  empty: { label: 'Empty', className: 'data-state-empty' },
  warning: { label: 'Warning', className: 'data-state-warning' },
  error: { label: 'Error', className: 'data-state-error' },
} as const;

export function DataState({
  title,
  message,
  tone = 'neutral',
  actions,
  detail,
}: {
  title: string;
  message: string;
  tone?: keyof typeof toneMeta;
  actions?: ReactNode;
  detail?: ReactNode;
}) {
  const meta = toneMeta[tone];

  return (
    <section className={`card data-state ${meta.className}`}>
      <div className="data-state-header">
        <span className="badge">{meta.label}</span>
        <strong>{title}</strong>
      </div>
      <p className="muted">{message}</p>
      {detail ? <div className="data-state-detail muted">{detail}</div> : null}
      {actions ? <div className="data-state-actions">{actions}</div> : null}
    </section>
  );
}
