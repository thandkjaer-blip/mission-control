import { ListShell } from '@/components/list-shell';

export default function AgentsPage() {
  return (
    <ListShell
      title="Agents"
      description="Fleet health, assignments, and heartbeat freshness. This scaffold is ready for URL-backed filters and a real agents query."
      columns={['Agent', 'Status', 'Type', 'Current task', 'Heartbeat']}
      rows={[
        ['agent-alpha', 'healthy', 'worker', 'task-201', '12s ago'],
        ['agent-beta', 'degraded', 'worker', 'task-203', '47s ago'],
      ]}
    />
  );
}
