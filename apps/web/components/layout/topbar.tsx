import { getPageTitle } from '@/lib/navigation';

export async function Topbar({ pathname }: { pathname?: string }) {
  const pageTitle = pathname ? getPageTitle(pathname) : 'Mission Control';

  return (
    <header className="topbar">
      <div>
        <div className="muted">local / operator shell</div>
        <strong>{pageTitle}</strong>
      </div>

      <div className="topbar-meta">
        <span className="badge">role: operator</span>
        <span className="badge">user: dev.stub</span>
        <span className="badge">live: scaffolded</span>
        <span className="badge">freshness: stub</span>
      </div>
    </header>
  );
}
