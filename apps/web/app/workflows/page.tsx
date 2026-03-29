import { ListShell } from '@/components/list-shell';

export default function WorkflowsPage() {
  return (
    <ListShell
      title="Workflows"
      description="Workflow runs, task graph drill-down, and orchestration health. This list shell is the handoff point for the first real workflow query."
      columns={['Workflow', 'Status', 'Trigger', 'Tasks', 'Updated']}
      rows={[
        ['workflow-sync', 'running', 'schedule', '6 tasks', 'just now'],
        ['workflow-billing', 'failed', 'manual', '4 tasks', '3m ago'],
      ]}
    />
  );
}
