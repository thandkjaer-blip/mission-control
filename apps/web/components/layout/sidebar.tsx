import { navItems } from '@/lib/navigation';
import { ShellNavLink } from '@/components/shell-nav-link';

const coreItems = navItems.filter((item) => item.section === 'core');
const supportItems = navItems.filter((item) => item.section === 'support');

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="muted">Mission Control</div>
        <h1>MVP shell</h1>
        <p className="muted sidebar-copy">
          Read-first operator surface for overview, agents, tasks, workflows, alerts, and commands.
        </p>
      </div>

      <nav className="nav" aria-label="Primary navigation">
        {coreItems.map((item) => (
          <ShellNavLink key={item.href} href={item.href} label={item.label} description={item.description} />
        ))}
      </nav>

      <div className="sidebar-section-label muted">Next MVP surfaces</div>
      <nav className="nav" aria-label="Secondary navigation">
        {supportItems.map((item) => (
          <ShellNavLink key={item.href} href={item.href} label={item.label} description={item.description} />
        ))}
      </nav>

      <div className="card sidebar-note">
        <h3>Shell direction</h3>
        <p className="muted">
          Overview is the trust anchor. Infrastructure, Costs, and Audit stay lightweight until the read model catches up.
        </p>
      </div>
    </aside>
  );
}
