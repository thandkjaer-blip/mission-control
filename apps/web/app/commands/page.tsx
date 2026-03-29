import { ListShell } from '@/components/list-shell';

export default function CommandsPage() {
  return (
    <ListShell
      title="Commands"
      description="Operator action history and status tracking. This keeps command confidence visible even before the write path is implemented."
      columns={['Command', 'Target', 'Requester', 'Status', 'Updated']}
      rows={[
        ['restart-agent', 'agent-beta', 'operator', 'pending', '30s ago'],
        ['retry-task', 'task-203', 'operator', 'succeeded', '6m ago'],
      ]}
    />
  );
}
