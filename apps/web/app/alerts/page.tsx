import { ListShell } from '@/components/list-shell';

export default function AlertsPage() {
  return (
    <ListShell
      title="Alerts"
      description="Operational issues and severity triage. This page is intentionally marked as reference-grade until alert read models land."
      state={{
        title: 'Reference data only',
        message: 'The alert rows below are illustrative placeholders. Use Overview for current trust signals until the alert list is API-backed.',
        tone: 'warning',
      }}
      columns={['Alert', 'Severity', 'Status', 'Source', 'Created']}
      rows={[
        ['alert-91', 'critical', 'open', 'task-203', '2m ago'],
        ['alert-90', 'warning', 'acknowledged', 'agent-beta', '17m ago'],
      ]}
    />
  );
}
