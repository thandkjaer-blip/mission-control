import { ListShell } from '@/components/list-shell';

export default function TasksPage() {
  return (
    <ListShell
      title="Tasks"
      description="Task triage surface for queued, running, failed, and blocked work. The table scaffold is ready for shared filter and pagination primitives."
      columns={['Task', 'Status', 'Priority', 'Workflow', 'Agent']}
      rows={[
        ['task-201', 'running', 'high', 'workflow-sync', 'agent-alpha'],
        ['task-203', 'failed', 'normal', 'workflow-billing', 'agent-beta'],
      ]}
    />
  );
}
