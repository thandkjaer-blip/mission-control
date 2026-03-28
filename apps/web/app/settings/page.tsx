import { PageHeader } from '@/components/page-header';

export default function SettingsPage() {
  return (
    <div className="page">
      <PageHeader
        title="Settings"
        description="Lightweight placeholder for operator profile, environment affordances, and future access-aware shell configuration."
      />

      <div className="grid columns">
        <section className="card stack">
          <h3>Session</h3>
          <p className="muted">User identity from GET /api/v1/me will hydrate this panel later.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span className="pill">role: operator</span>
            <span className="pill">permissions: runtime-actions</span>
          </div>
        </section>

        <section className="card stack">
          <h3>Shell configuration</h3>
          <ul className="list">
            <li>Persist preferred filters and saved views</li>
            <li>Expose live reconnect and stale thresholds</li>
            <li>Keep audit-safe action confirmations centralized</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
