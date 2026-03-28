import type { Route } from 'next';

export type NavItem = {
  href: Route;
  label: string;
  description: string;
};

export const navItems: NavItem[] = [
  { href: '/overview', label: 'Overview', description: 'Platform state and attention queues' },
  { href: '/agents', label: 'Agents', description: 'Fleet health, assignments, heartbeat freshness' },
  { href: '/tasks', label: 'Tasks', description: 'Queued, running, failed, and blocked work' },
  { href: '/workflows', label: 'Workflows', description: 'Orchestration runs and task graphs' },
  { href: '/alerts', label: 'Alerts', description: 'Open operational issues and severities' },
  { href: '/usage', label: 'Usage', description: 'Burn, throughput, and cost placeholders' },
  { href: '/settings', label: 'Settings', description: 'Profile, access, and shell configuration' },
];
