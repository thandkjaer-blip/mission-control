import { PageHeader } from '@/components/page-header';

export default async function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;

  return (
    <section className="page">
      <PageHeader
        title={`Task ${taskId}`}
        description="Task detail shell for summary, dependencies, events, logs, costs, and action placeholders."
        eyebrow="Task detail"
      />
      <div className="panel">Summary / dependencies / events / costs</div>
    </section>
  );
}
