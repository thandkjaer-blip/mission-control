import { PageHeader } from '../../../components/ui/page-header';

export default async function AgentDetailPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params;
  return <section><PageHeader title={`Agent ${agentId}`} description="Agent detail shell with room for tabs, logs, events, and commands." /><div className="panel">Summary / events / logs / metrics</div></section>;
}
