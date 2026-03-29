import Link from 'next/link';
import type { TasksListQuery } from '@mission-control/shared/contracts/filters';

import { DataState } from '@/components/data-state';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { ApiClientError, getApiBaseUrl, getTasks } from '@/lib/api';
import { formatRelativeTime, titleCase } from '@/lib/format';

export default async function TasksPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (typeof value === 'string' && value.length > 0) {
      query.set(key, value);
    }
  }

  try {
    const tasks = await getTasks(query);
    const status = (query.get('status') ?? '') as TasksListQuery['status'];

    return (
      <section className="page">
        <PageHeader
          title="Tasks"
          description="Task triage is now backed by the shared read contract. URL filters already round-trip to the API, even though the visual filter bar is still lightweight."
          eyebrow="Tasks"
          actions={<span className="badge">{tasks.pagination.total} total</span>}
        />

        {status ? <div className="badge">filter: status={status}</div> : null}

        <section className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Workflow</th>
                <th>Agent</th>
                <th>Started</th>
              </tr>
            </thead>
            <tbody>
              {tasks.items.map((task) => (
                <tr key={task.id}>
                  <td>
                    <Link href={`/tasks/${task.id}`} className="table-link">
                      <strong>{task.title}</strong>
                    </Link>
                  </td>
                  <td><StatusBadge value={task.status} /></td>
                  <td>{titleCase(task.priority)}</td>
                  <td>{task.workflowName ?? 'Standalone'}</td>
                  <td>{task.agentName ?? 'Unassigned'}</td>
                  <td>{formatRelativeTime(task.startedAt ?? task.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <DataState
          title="Temporary gap"
          message="Dependency graph widgets, retry/cancel affordances, and event/log/cost tabs still need their dedicated read slices."
        />
      </section>
    );
  } catch (error) {
    const message =
      error instanceof ApiClientError
        ? `${error.message} Current base: ${getApiBaseUrl()}.`
        : 'Unexpected tasks load failure.';

    return (
      <section className="page">
        <PageHeader title="Tasks" description="Task triage surface." eyebrow="Tasks" />
        <DataState title="Tasks unavailable" message={message} tone="warning" />
      </section>
    );
  }
}
