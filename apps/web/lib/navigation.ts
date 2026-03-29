import type { Route } from 'next';

export type NavItem = {
  href: Route;
  label: string;
  description: string;
  section: 'core' | 'support';
};

export const navItems: NavItem[] = [
  {
    href: '/overview',
    label: 'Overview',
    description: 'Platform state, freshness, and attention queues',
    section: 'core',
  },
  {
    href: '/agents',
    label: 'Agents',
    description: 'Fleet health, assignments, and heartbeat freshness',
    section: 'core',
  },
  {
    href: '/tasks',
    label: 'Tasks',
    description: 'Queued, running, failed, and blocked work',
    section: 'core',
  },
  {
    href: '/workflows',
    label: 'Workflows',
    description: 'Orchestration runs and task graph drill-down',
    section: 'core',
  },
  {
    href: '/alerts',
    label: 'Alerts',
    description: 'Operational issues, severities, and source links',
    section: 'core',
  },
  {
    href: '/commands',
    label: 'Commands',
    description: 'Operator actions and command status history',
    section: 'core',
  },
  {
    href: '/infrastructure',
    label: 'Infrastructure',
    description: 'Providers, runtime services, and platform health',
    section: 'support',
  },
  {
    href: '/costs',
    label: 'Costs',
    description: 'Burn rate, usage, and spend visibility',
    section: 'support',
  },
  {
    href: '/audit',
    label: 'Audit',
    description: 'Governance, audit trail, and review surfaces',
    section: 'support',
  },
];

export function getPageTitle(pathname: string) {
  const matched = navItems.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return matched?.label ?? 'Mission Control';
}
