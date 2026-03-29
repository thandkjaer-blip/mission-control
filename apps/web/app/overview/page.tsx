import Link from 'next/link';

import { DataState } from '@/components/data-state';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { ApiClientError, getApiBaseUrl, getOverview } from '@/lib/api';
import { formatDateTime, formatUsd } from '@/lib/format';

export default async function OverviewPage() {
  try {
    const overview = await getOverview();

    const cards = [
      { label: 'Agents', value: `${overview.agents.total} total`, href: '/agents' },
      { label: 'Tasks', value: `${overview.tasks.running} running`, href: '/tasks?status=running' },
      { label: 'Workflows', value: `${overview.workflows.running} running`, href: '/workflows?status=running' },
      { label: 'Alerts', value: `${overview.alerts.critical} critical`, href: '/alerts' },
      { label: 'Burn rate', value: `${formatUsd(overview.cost.currentBurnRateUsdPerHour)}/hr`, href: '/costs' },
      { label: 'Spend today', value: formatUsd(overview.cost.todayUsd), href: '/costs' },
    ];

    return (
      <section className="page">
        <PageHeader
          title="Overview"
          description="Live operational snapshot from the new read API. The core cards are now real; deeper attention queues still wait on the next read slices."
          eyebrow="MVP overview"
          actions={<span className="badge">generated {formatDateTime(overview.generatedAt)}</span>}
        />

        <div className="card-grid">
          {cards.map((card) => (
            <Link key={card.label} href={card.href} className="card card-link">
              <div className="muted">{card.label}</div>
              <strong>{card.value}</strong>
            </Link>
          ))}
        </div>

        <div className="card-grid card-grid-wide">
          <section className="card">
            <h3>Operational counters</h3>
            <ul className="detail-list compact-list">
              <li><span className="muted">Agent fleet</span><strong>{overview.agents.idle} idle / {overview.agents.working} working / {overview.agents.failed} failed / {overview.agents.degraded} degraded</strong></li>
              <li><span className="muted">Task queue</span><strong>{overview.tasks.pending} pending / {overview.tasks.running} running / {overview.tasks.failed24h} failed in 24h</strong></li>
              <li><span className="muted">Workflow health</span><strong>{overview.workflows.running} running / {overview.workflows.failed24h} failed in 24h</strong></li>
              <li><span className="muted">Open alerts</span><strong>{overview.alerts.open} open / {overview.alerts.critical} critical</strong></li>
            </ul>
          </section>

          <section className="card">
            <h3>Infrastructure and providers</h3>
            <div className="provider-stack">
              <div className="provider-row">
                <span>Platform</span>
                <StatusBadge value={overview.infra.status} />
              </div>
              {overview.providers.map((provider) => (
                <div key={provider.name} className="provider-row">
                  <span>{provider.name}</span>
                  <StatusBadge value={provider.status} />
                </div>
              ))}
            </div>
          </section>
        </div>

        <DataState
          title="Temporary gap"
          message="Attention queue, recent failures, provider drill-down, and command activity are still placeholder-grade because their dedicated read models are not wired yet."
        />
      </section>
    );
  } catch (error) {
    const message =
      error instanceof ApiClientError
        ? `${error.message} Set NEXT_PUBLIC_API_BASE_URL or MISSION_CONTROL_API_URL if the API runs elsewhere. Current base: ${getApiBaseUrl()}.`
        : 'Unexpected overview load failure.';

    return (
      <section className="page">
        <PageHeader
          title="Overview"
          description="Read-first overview shell with real API wiring and graceful failure states."
          eyebrow="MVP overview"
        />
        <DataState title="Overview unavailable" message={message} tone="warning" />
      </section>
    );
  }
}
