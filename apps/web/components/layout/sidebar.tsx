import Link from 'next/link';

const nav = [
  ['Overview', '/overview'],
  ['Agents', '/agents'],
  ['Tasks', '/tasks'],
  ['Workflows', '/workflows'],
  ['Alerts', '/alerts'],
  ['Commands', '/commands']
] as const;

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div>
        <div className="muted">Mission Control</div>
        <h1>WP1 shell</h1>
      </div>
      <nav>
        {nav.map(([label, href]) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
