import { ListShell } from '@/components/list-shell';

export default function AlertsPage() {
  return (
    <ListShell
      title="Alerts"
      description="Operational issues and severity triage. Kept lightweight for now, but aligned to the MVP route map."
      columns={['Alert', 'Severity', 'Status', 'Source', 'Created']}
      rows={[
        ['alert-91', 'critical', 'open', 'task-203', '2m ago'],
        ['alert-90', 'warning', 'acknowledged', 'agent-beta', '17m ago'],
      ]}
    />
  );
}
