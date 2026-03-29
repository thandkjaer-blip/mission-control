import { revalidatePath } from 'next/cache';

import { PageHeader } from '@/components/page-header';

export const dynamic = 'force-dynamic';
import { StatusBadge } from '@/components/status-badge';
import { getCommands, sendToJarvis } from '@/lib/api';
import { formatDateTime, formatDuration } from '@/lib/format';

async function submitSendToJarvis(formData: FormData) {
  'use server';

  const message = String(formData.get('message') ?? '').trim();
  const reason = String(formData.get('reason') ?? '').trim();

  if (!message) {
    return;
  }

  await sendToJarvis({
    message,
    reason: reason || undefined,
    mode: 'default',
    idempotencyKey: crypto.randomUUID(),
  });

  revalidatePath('/commands');
}

export default async function CommandsPage() {
  const commands = await getCommands(new URLSearchParams({ targetType: 'agent', targetId: 'main', pageSize: '20' }));

  const active = commands.items.filter((command) => ['pending', 'approved', 'executing'].includes(command.status));
  const failed = commands.items.filter((command) => command.status === 'failed');
  const succeeded = commands.items.filter((command) => command.status === 'succeeded');
  const latestCompleted = commands.items.find((command) => ['succeeded', 'failed', 'cancelled'].includes(command.status)) ?? null;

  return (
    <div className="page">
      <PageHeader
        title="Commands"
        description="Send en kort operator-besked til Jarvis og læs lifecycle, svar og fejl tilbage uden at rode i rå DB-felter."
      />

      <section className="card-grid card-grid-wide">
        <article className="card">
          <div className="muted">Active now</div>
          <h3>{active.length}</h3>
          <p className="muted">Pending + executing commands, så køen er synlig med det samme.</p>
        </article>
        <article className="card">
          <div className="muted">Succeeded</div>
          <h3>{succeeded.length}</h3>
          <p className="muted">Baseret på de seneste 20 commands for agent:main.</p>
        </article>
        <article className="card">
          <div className="muted">Failed</div>
          <h3>{failed.length}</h3>
          <p className="muted">Fejl er løftet frem med code + preview i stedet for kun status.</p>
        </article>
      </section>

      <section className="card" style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <h2>Send til Jarvis</h2>
          <p className="muted">Smalt MVP-snit: én command-type, async execution og bedre status/readback.</p>
        </div>

        <form action={submitSendToJarvis} style={{ display: 'grid', gap: '0.75rem' }}>
          <label style={{ display: 'grid', gap: '0.35rem' }}>
            <span>Besked</span>
            <textarea name="message" rows={5} placeholder="Fx: Tjek gateway-status og svar kort." required className="input" />
          </label>

          <label style={{ display: 'grid', gap: '0.35rem' }}>
            <span>Reason (valgfri)</span>
            <input name="reason" type="text" placeholder="Hvorfor sender du kommandoen?" className="input" />
          </label>

          <div>
            <button className="button primary" type="submit">
              Send til Jarvis
            </button>
          </div>
        </form>
      </section>

      {latestCompleted ? (
        <section className="card" style={{ display: 'grid', gap: '0.75rem' }}>
          <div>
            <h2>Latest completed readback</h2>
            <p className="muted">Sidste afsluttede command med det vigtigste resultat samlet ét sted.</p>
          </div>

          <div className="command-readback-grid">
            <div>
              <div className="muted">Status</div>
              <StatusBadge value={latestCompleted.status} />
            </div>
            <div>
              <div className="muted">Finished</div>
              <div>{formatDateTime(latestCompleted.executionFinishedAt)}</div>
            </div>
            <div>
              <div className="muted">Duration</div>
              <div>{formatDuration(latestCompleted.durationMs)}</div>
            </div>
            <div>
              <div className="muted">Correlation</div>
              <code className="inline-code">{latestCompleted.correlationId ?? '—'}</code>
            </div>
          </div>

          <div>
            <div className="muted">Summary</div>
            <div>{latestCompleted.summary ?? '—'}</div>
          </div>

          <div>
            <div className="muted">Outcome</div>
            <div>{latestCompleted.outcome.message ?? '—'}</div>
            {latestCompleted.errorCode ? <div className="muted">Error code: {latestCompleted.errorCode}</div> : null}
          </div>
        </section>
      ) : null}

      <section className="card">
        <div style={{ marginBottom: '1rem' }}>
          <h2>Recent command history</h2>
          <p className="muted">Mere nyttig operatørvisning: status, varighed, correlation-id og kort result/error preview.</p>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Command</th>
              <th>Status</th>
              <th>Queued</th>
              <th>Duration</th>
              <th>Summary</th>
              <th>Readback / error</th>
            </tr>
          </thead>
          <tbody>
            {commands.items.map((command) => (
              <tr key={command.id}>
                <td>
                  <div>{command.type}</div>
                  <div className="muted">{command.targetType}:{command.targetId}</div>
                  <div className="muted">by {command.requestedBy}</div>
                  <div className="muted">corr: {command.correlationId ?? '—'}</div>
                </td>
                <td>
                  <StatusBadge value={command.status} />
                  {command.errorCode ? <div className="command-subtle-error">{command.errorCode}</div> : null}
                </td>
                <td>
                  <div>{formatDateTime(command.requestedAt)}</div>
                  <div className="muted">updated {formatDateTime(command.updatedAt)}</div>
                </td>
                <td>{formatDuration(command.durationMs)}</td>
                <td>{command.summary ?? '—'}</td>
                <td>
                  <div>{command.resultPreview ?? command.outcome.message ?? '—'}</div>
                </td>
              </tr>
            ))}
            {commands.items.length === 0 ? (
              <tr>
                <td colSpan={6}>Ingen Jarvis-commands endnu.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
