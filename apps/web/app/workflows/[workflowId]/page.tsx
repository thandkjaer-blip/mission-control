import { PageHeader } from '../../../components/ui/page-header';

export default async function WorkflowDetailPage({ params }: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = await params;
  return <section><PageHeader title={`Workflow ${workflowId}`} description="Workflow detail shell with graph/tasks/costs tabs to be wired later." /><div className="panel">Summary / graph / tasks / events / costs</div></section>;
}
