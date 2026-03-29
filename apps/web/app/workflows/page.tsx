import Link from 'next/link';
import type { WorkflowsListQuery } from '@mission-control/shared/contracts/filters';

import { DataState } from '@/components/data-state';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { ApiClientError, getApiBaseUrl, getWorkflows } from '@/lib/api';
import { formatRelativeTime, titleCase } from '@/lib/format';

export default async function WorkflowsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (typeof value === 'string' && value.length > 0) {
      query.set(key, value);
    }
  }

  try {
    const workflows = await getWorkflows(query);
    const status = (query.get('status') ?? '') as WorkflowsListQuery['status'];

    return (
      <section className="page">
        <PageHeader
          title="Workflows"
          description="Workflow orchestration state now comes from the shared read API. This is a real list/detail handoff point instead of static scaffolding."
          eyebrow="Workflows"
          actions={<span className="badge">{workflows.pagination.total} total</span>}
        />

        {status ? <div className="badge">filter: status={status}</div> : null}

        <section className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Workflow</th>
                <th>Status</th>
                <th>Trigger</th>
                <th>Tasks</th>
                <th>Failures</th>
                <th>Started</th>
              </tr>
            </thead>
            <tbody>
              {workflows.items.map((workflow) => (
                <tr key={workflow.id}>
                  <td>
                    <Link href={`/workflows/${workflow.id}`} className="table-link">
                      <strong>{workflow.name}</strong>
                    </Link>
                  </td>
                  <td><StatusBadge value={workflow.status} /></td>
                  <td>{titleCase(workflow.triggerType)}</td>
                  <td>{workflow.completedTasks}/{workflow.totalTasks}</td>
                  <td>{workflow.failedTasks}</td>
                  <td>{formatRelativeTime(workflow.startedAt ?? workflow.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <DataState
          title="Temporary gap"
          message="Graph rendering, workflow events, workflow-scoped tasks, and cost drill-down remain the next read-model step."
        />
      </section>
    );
  } catch (error) {
    const message =
      error instanceof ApiClientError
        ? `${error.message} Current base: ${getApiBaseUrl()}.`
        : 'Unexpected workflows load failure.';

    return (
      <section className="page">
        <PageHeader title="Workflows" description="Workflow runs and orchestration health." eyebrow="Workflows" />
        <DataState title="Workflows unavailable" message={message} tone="warning" />
      </section>
    );
  }
}
