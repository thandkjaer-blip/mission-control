import Link from 'next/link';

import { PageHeader } from '@/components/page-header';

const cards = [
  { label: 'Agents', value: '4 total', href: '/agents' },
  { label: 'Tasks', value: '3 running', href: '/tasks' },
  { label: 'Workflows', value: '2 active', href: '/workflows' },
  { label: 'Alerts', value: '1 critical', href: '/alerts' },
  { label: 'Commands', value: '2 inflight', href: '/commands' },
];

export default function OverviewPage() {
  return (
    <section className="page">
      <PageHeader
        title="Overview"
        description="Read-first overview shell with room for REST queries, freshness states, and live invalidation."
        eyebrow="MVP overview"
      />

      <div className="card-grid">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="card card-link">
            <div className="muted">{card.label}</div>
            <strong>{card.value}</strong>
          </Link>
        ))}
      </div>
    </section>
  );
}
