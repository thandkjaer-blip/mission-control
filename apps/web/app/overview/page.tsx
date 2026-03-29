import Link from 'next/link';

import { DataState } from '@/components/data-state';
import { FreshnessBadge } from '@/components/freshness-badge';
import { PageHeader } from '@/components/page-header';
import { RuntimeRefreshCard } from '@/components/runtime-refresh-card';
import { StatusBadge } from '@/components/status-badge';
import { ApiClientError, getApiBaseUrl, getOverview, getRuntimeSource } from '@/lib/api';
import { formatDateTime, formatUsd } from '@/lib/format';
import { formatAgeCompact, getFreshnessState } from '@/lib/freshness';
import { getLiveUrl } from '@/lib/live';

export default async function OverviewPage() {
  try {
    const overview = await getOverview();
    const runtimeSource = await getRuntimeSource().catch(() => null);
    const freshness = getFreshnessState(overview.generatedAt);

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
          description="Use this page as the trust anchor for the current shell: it shows what is real, how fresh it is, and where the UI still falls back to reference-grade placeholders."
          eyebrow="Overview-first trust layer"
          actions={
            <>
              <FreshnessBadge state={freshness} />
              <span className="badge">snapshot {formatDateTime(overview.generatedAt)}</span>
            </>
          }
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
            <h3>Trust and freshness</h3>
            <ul className="detail-list compact-list">
              <li><span className="muted">Snapshot generated</span><strong>{formatDateTime(overview.generatedAt)}</strong></li>
              <li><span className="muted">Snapshot age</span><strong>{formatAgeCompact(freshness.ageMs)}</strong></li>
              <li><span className="muted">Current trust level</span><FreshnessBadge state={freshness} /></li>
              <li><span className="muted">Live transport</span><strong>{getLiveUrl()}</strong></li>
            </ul>
          </section>

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
            <h3>OpenClaw runtime projection</h3>
            <ul className="detail-list compact-list">
              <li><span className="muted">Projected runtime objects</span><strong>{overview.runtime.projectedWorkflows} workflows / {overview.runtime.projectedAgents} agents / {overview.runtime.projectedTasks} tasks</strong></li>
              <li><span className="muted">Subagent lanes</span><strong>{overview.runtime.subagentAgents}</strong></li>
              <li><span className="muted">Latest runtime event</span><strong>{overview.runtime.latestRuntimeEventAt ? formatDateTime(overview.runtime.latestRuntimeEventAt) : 'none yet'}</strong></li>
              <li><span className="muted">Last import</span><strong>{overview.runtime.lastRefresh ? `${formatDateTime(overview.runtime.lastRefresh.refreshedAt)} · ${overview.runtime.lastRefresh.events} events` : 'none yet'}</strong></li>
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

        {runtimeSource ? <RuntimeRefreshCard source={runtimeSource} /> : null}

        <DataState
          title="Known limits before realtime"
          message="Alerts, commands, deep attention queues, and drill-down timelines are not live yet. Treat those pages as reference surfaces unless they explicitly show a real API-backed timestamp or record count."
          tone={freshness.isStale ? 'warning' : 'info'}
          detail={`The shell now exposes snapshot age and stale signals, but it still depends on request-time reloads rather than streaming updates.`}
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
          eyebrow="Overview-first trust layer"
        />
        <DataState
          title="Overview unavailable"
          message={message}
          tone="error"
          detail="The shell can render, but it cannot currently prove freshness because the overview snapshot did not load."
        />
      </section>
    );
  }
}
