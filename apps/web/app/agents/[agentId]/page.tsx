import { DataState } from '@/components/data-state';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { ApiClientError, getAgent, getApiBaseUrl } from '@/lib/api';
import { formatDateTime, formatPercent, formatUsd, titleCase } from '@/lib/format';

export default async function AgentDetailPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params;

  try {
    const agent = await getAgent(agentId);

    return (
      <section className="page">
        <PageHeader
          title={agent.name}
          description="Agent detail summary from the shared read contract. Events/logs/metrics are still pending, but the primary operational facts are now live."
          eyebrow="Agent detail"
          actions={<StatusBadge value={agent.status} />}
        />

        <div className="card-grid card-grid-wide">
          <section className="card">
            <h3>Summary</h3>
            <ul className="detail-list">
              <li><span className="muted">Type</span><strong>{titleCase(agent.type)}</strong></li>
              <li><span className="muted">Health</span><strong>{titleCase(agent.health)}</strong></li>
              <li><span className="muted">Current task</span><strong>{agent.currentTaskTitle ?? 'None'}</strong></li>
              <li><span className="muted">Heartbeat</span><strong>{formatDateTime(agent.lastHeartbeatAt)}</strong></li>
              <li><span className="muted">Version</span><strong>{agent.version}</strong></li>
            </ul>
          </section>

          <section className="card">
            <h3>Performance</h3>
            <ul className="detail-list">
              <li><span className="muted">Success rate</span><strong>{formatPercent(agent.successRate)}</strong></li>
              <li><span className="muted">Completed tasks</span><strong>{agent.totalTasksCompleted}</strong></li>
              <li><span className="muted">Avg task duration</span><strong>{Math.round(agent.avgTaskDurationMs / 1000)}s</strong></li>
              <li><span className="muted">Token usage total</span><strong>{agent.tokenUsageTotal.toLocaleString('en')}</strong></li>
              <li><span className="muted">Cost total</span><strong>{formatUsd(agent.costTotalUsd)}</strong></li>
            </ul>
          </section>
        </div>

        <section className="card">
          <h3>Recent tasks</h3>
          {agent.recentTasks.length > 0 ? (
            <ul className="detail-list compact-list">
              {agent.recentTasks.map((task) => (
                <li key={task.id}>
                  <span>{task.title}</span>
                  <span className="detail-inline"><StatusBadge value={task.status} /></span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No recent tasks in the current payload.</p>
          )}
        </section>

        <DataState
          title="Temporary gap"
          message="The detail shell still lacks events/logs/metrics tabs and command controls because those APIs are not part of the current slice."
        />
      </section>
    );
  } catch (error) {
    const message =
      error instanceof ApiClientError
        ? `${error.message} Current base: ${getApiBaseUrl()}.`
        : `Unexpected failure while loading agent ${agentId}.`;

    return (
      <section className="page">
        <PageHeader title={`Agent ${agentId}`} description="Agent detail shell." eyebrow="Agent detail" />
        <DataState title="Agent unavailable" message={message} tone="warning" />
      </section>
    );
  }
}
