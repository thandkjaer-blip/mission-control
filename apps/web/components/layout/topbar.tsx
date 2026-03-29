import { FreshnessBadge } from '@/components/freshness-badge';
import { getPageTitle } from '@/lib/navigation';
import type { ShellStatus } from '@/lib/shell-status';

export function Topbar({ pathname, status }: { pathname?: string; status: ShellStatus }) {
  const pageTitle = pathname ? getPageTitle(pathname) : 'Mission Control';

  return (
    <header className="topbar">
      <div>
        <div className="muted">overview-first / operator shell</div>
        <strong>{pageTitle}</strong>
        <div className="topbar-subtitle muted">Read-model shell with explicit freshness and placeholder boundaries.</div>
      </div>

      <div className="topbar-meta">
        <span className="badge">{status.operatorLabel}</span>
        <span className={`status-badge status-${status.apiTone}`}>{status.apiLabel}</span>
        <span className={`status-badge status-${status.liveTone}`}>{status.liveLabel}</span>
        <FreshnessBadge state={status.freshness} />
      </div>
    </header>
  );
}
