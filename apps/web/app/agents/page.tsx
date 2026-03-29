import Link from 'next/link';
import type { AgentsListQuery } from '@mission-control/shared/contracts/filters';

import { DataState } from '@/components/data-state';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { ApiClientError, getAgents, getApiBaseUrl } from '@/lib/api';
import { formatPercent, formatRelativeTime, formatUsd, titleCase } from '@/lib/format';

export default async function AgentsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (typeof value === 'string' && value.length > 0) {
      query.set(key, value);
    }
  }

  try {
    const agents = await getAgents(query);
    const status = (query.get('status') ?? '') as AgentsListQuery['status'];

    return (
      <section className="page">
        <PageHeader
          title="Agents"
          description="Fleet health and assignments from the new read API. Filters are URL-driven already; richer control widgets can now land on top instead of replacing mock data."
          eyebrow="Agents"
          actions={<span className="badge">{agents.pagination.total} total</span>}
        />

        {status ? <div className="badge">filter: status={status}</div> : null}

        <section className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Status</th>
                <th>Type</th>
                <th>Current task</th>
                <th>Heartbeat</th>
                <th>Success</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              {agents.items.map((agent) => (
                <tr key={agent.id}>
                  <td>
                    <Link href={`/agents/${agent.id}`} className="table-link">
                      <strong>{agent.name}</strong>
                    </Link>
                  </td>
                  <td><StatusBadge value={agent.status} /></td>
                  <td>{titleCase(agent.type)}</td>
                  <td>{agent.currentTaskTitle ?? '—'}</td>
                  <td>{formatRelativeTime(agent.lastHeartbeatAt)}</td>
                  <td>{formatPercent(agent.successRate)}</td>
                  <td>{formatUsd(agent.costTotalUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <DataState
          title="Temporary gap"
          message="Operator actions, richer filter controls, and agent events/logs/metrics subqueries are still pending. This page now uses the real list payload instead of static rows."
        />
      </section>
    );
  } catch (error) {
    const message =
      error instanceof ApiClientError
        ? `${error.message} Current base: ${getApiBaseUrl()}.`
        : 'Unexpected agents load failure.';

    return (
      <section className="page">
        <PageHeader title="Agents" description="Fleet health and assignments." eyebrow="Agents" />
        <DataState title="Agents unavailable" message={message} tone="warning" />
      </section>
    );
  }
}
