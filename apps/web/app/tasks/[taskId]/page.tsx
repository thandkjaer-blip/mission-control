import { PageHeader } from '../../../components/ui/page-header';

export default async function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  return <section><PageHeader title={`Task ${taskId}`} description="Task detail shell with dependencies, logs, and action placeholder." /><div className="panel">Summary / dependencies / events / costs</div></section>;
}
