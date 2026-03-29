import { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow ? <div className="muted page-eyebrow">{eyebrow}</div> : null}
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {actions ? <div className="header-actions">{actions}</div> : null}
    </header>
  );
}
