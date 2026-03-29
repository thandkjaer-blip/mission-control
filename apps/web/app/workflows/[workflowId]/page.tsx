import { DataState } from '@/components/data-state';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { ApiClientError, getApiBaseUrl, getWorkflow } from '@/lib/api';
import { formatDateTime, formatUsd, titleCase } from '@/lib/format';

export default async function WorkflowDetailPage({ params }: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = await params;

  try {
    const workflow = await getWorkflow(workflowId);

    return (
      <section className="page">
        <PageHeader
          title={workflow.name}
          description="Workflow detail is now fed by the real read contract. The graph is still a placeholder, but task membership and rollout state are live."
          eyebrow="Workflow detail"
          actions={<StatusBadge value={workflow.status} />}
        />

        <div className="card-grid card-grid-wide">
          <section className="card">
            <h3>Summary</h3>
            <ul className="detail-list">
              <li><span className="muted">Trigger</span><strong>{titleCase(workflow.triggerType)}</strong></li>
              <li><span className="muted">Initiated by</span><strong>{workflow.initiatedBy}</strong></li>
              <li><span className="muted">Started</span><strong>{formatDateTime(workflow.startedAt ?? workflow.createdAt)}</strong></li>
              <li><span className="muted">Completed</span><strong>{formatDateTime(workflow.completedAt)}</strong></li>
              <li><span className="muted">SLA class</span><strong>{workflow.slaClass ?? '—'}</strong></li>
            </ul>
          </section>

          <section className="card">
            <h3>Rollup</h3>
            <ul className="detail-list">
              <li><span className="muted">Task progress</span><strong>{workflow.completedTasks} / {workflow.totalTasks}</strong></li>
              <li><span className="muted">Failed tasks</span><strong>{workflow.failedTasks}</strong></li>
              <li><span className="muted">Total tokens</span><strong>{workflow.totalTokens.toLocaleString('en')}</strong></li>
              <li><span className="muted">Total cost</span><strong>{formatUsd(workflow.totalCostUsd)}</strong></li>
            </ul>
          </section>
        </div>

        <section className="card">
          <h3>Tasks</h3>
          <ul className="detail-list compact-list">
            {workflow.tasks.map((task) => (
              <li key={task.id}>
                <span>{task.title}</span>
                <span className="detail-inline">{task.assignedAgentName ?? 'Unassigned'} · <StatusBadge value={task.status} /></span>
              </li>
            ))}
          </ul>
        </section>

        <DataState
          title="Temporary gap"
          message="Graph visualization, events, workflow-scoped cost history, and rerun/pause/resume affordances remain intentionally deferred until their APIs exist."
        />
      </section>
    );
  } catch (error) {
    const message =
      error instanceof ApiClientError
        ? `${error.message} Current base: ${getApiBaseUrl()}.`
        : `Unexpected failure while loading workflow ${workflowId}.`;

    return (
      <section className="page">
        <PageHeader title={`Workflow ${workflowId}`} description="Workflow detail shell." eyebrow="Workflow detail" />
        <DataState title="Workflow unavailable" message={message} tone="warning" />
      </section>
    );
  }
}
