import { PageHeader } from '@/components/page-header';

export default async function WorkflowDetailPage({ params }: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = await params;

  return (
    <section className="page">
      <PageHeader
        title={`Workflow ${workflowId}`}
        description="Workflow detail shell with space for summary, graph, tasks, events, costs, and rerun controls."
        eyebrow="Workflow detail"
      />
      <div className="panel">Summary / graph / tasks / events / costs</div>
    </section>
  );
}
