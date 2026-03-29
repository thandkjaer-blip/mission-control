import { PageHeader } from '@/components/page-header';

export default async function AgentDetailPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params;

  return (
    <section className="page">
      <PageHeader
        title={`Agent ${agentId}`}
        description="Agent detail shell with room for summary, events, logs, metrics, and command actions."
        eyebrow="Agent detail"
      />
      <div className="panel">Summary / events / logs / metrics</div>
    </section>
  );
}
