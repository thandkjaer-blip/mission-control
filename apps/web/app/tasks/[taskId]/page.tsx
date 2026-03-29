import { DataState } from '@/components/data-state';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { ApiClientError, getApiBaseUrl, getTask } from '@/lib/api';
import { formatDateTime, titleCase } from '@/lib/format';

export default async function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;

  try {
    const task = await getTask(taskId);

    return (
      <section className="page">
        <PageHeader
          title={task.title}
          description="Task detail now reads from the shared contract. Dependencies and core metadata are live; logs/events/cost history still wait on the next endpoints."
          eyebrow="Task detail"
          actions={<StatusBadge value={task.status} />}
        />

        <div className="card-grid card-grid-wide">
          <section className="card">
            <h3>Summary</h3>
            <ul className="detail-list">
              <li><span className="muted">Priority</span><strong>{titleCase(task.priority)}</strong></li>
              <li><span className="muted">Workflow</span><strong>{task.workflowName ?? 'Standalone'}</strong></li>
              <li><span className="muted">Assigned agent</span><strong>{task.agentName ?? 'Unassigned'}</strong></li>
              <li><span className="muted">Created by</span><strong>{task.createdBy}</strong></li>
              <li><span className="muted">Created</span><strong>{formatDateTime(task.createdAt)}</strong></li>
            </ul>
          </section>

          <section className="card">
            <h3>Execution</h3>
            <ul className="detail-list">
              <li><span className="muted">Started</span><strong>{formatDateTime(task.startedAt)}</strong></li>
              <li><span className="muted">Completed</span><strong>{formatDateTime(task.completedAt)}</strong></li>
              <li><span className="muted">Due</span><strong>{formatDateTime(task.dueAt)}</strong></li>
              <li><span className="muted">Retries</span><strong>{task.retryCount} / {task.maxRetries}</strong></li>
              <li><span className="muted">Parent task</span><strong>{task.parentTaskId ?? '—'}</strong></li>
            </ul>
          </section>
        </div>

        <section className="card">
          <h3>Dependencies</h3>
          <ul className="detail-list compact-list">
            {task.dependencies.map((dependency) => (
              <li key={`${dependency.taskId}-${dependency.dependencyType}`}>
                <span>{dependency.title}</span>
                <span className="detail-inline">{titleCase(dependency.dependencyType)} · <StatusBadge value={dependency.status} /></span>
              </li>
            ))}
            {task.dependencies.length === 0 ? <li><span className="muted">No upstream dependencies.</span></li> : null}
          </ul>
        </section>

        <section className="card">
          <h3>Dependents</h3>
          <ul className="detail-list compact-list">
            {task.dependents.map((dependent) => (
              <li key={`${dependent.taskId}-${dependent.dependencyType}`}>
                <span>{dependent.title}</span>
                <span className="detail-inline">{titleCase(dependent.dependencyType)} · <StatusBadge value={dependent.status} /></span>
              </li>
            ))}
            {task.dependents.length === 0 ? <li><span className="muted">No downstream dependents.</span></li> : null}
          </ul>
        </section>

        <DataState
          title="Temporary gap"
          message="Task input/output/error payloads are available in the API contract but still not rendered richly here; event/log/cost tabs also remain pending."
        />
      </section>
    );
  } catch (error) {
    const message =
      error instanceof ApiClientError
        ? `${error.message} Current base: ${getApiBaseUrl()}.`
        : `Unexpected failure while loading task ${taskId}.`;

    return (
      <section className="page">
        <PageHeader title={`Task ${taskId}`} description="Task detail shell." eyebrow="Task detail" />
        <DataState title="Task unavailable" message={message} tone="warning" />
      </section>
    );
  }
}
