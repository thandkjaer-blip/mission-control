import Link from 'next/link';
import { ReactNode } from 'react';

import { navItems } from '@/lib/navigation';
import { ShellNavLink } from '@/components/shell-nav-link';

export function OperatorShell({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <h1>Mission Control</h1>
          <p>Operator shell · WP1 scaffold</p>
        </div>

        <nav className="nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <ShellNavLink key={item.href} href={item.href} label={item.label} description={item.description} />
          ))}
        </nav>

        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 8 }}>Shell notes</h3>
          <p className="muted" style={{ margin: 0 }}>
            Read-first routes now. Live updates, filters, RBAC-aware actions, and deeper detail views layer on top in later work packages.
          </p>
          <p style={{ marginTop: 12, marginBottom: 0 }}>
            <Link href="/overview" className="badge success">Go to overview</Link>
          </p>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-meta">
            <span className="pill">env: local</span>
            <span className="pill">role: operator</span>
            <span className="pill">user: dev.stub</span>
          </div>
          <div className="topbar-status">
            <span className="pill live">live: connected (stub)</span>
            <span className="pill">updated: just now</span>
            <span className="pill">search: soon</span>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
