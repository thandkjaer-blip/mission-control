import { PageHeader } from '@/components/page-header';

export default function InfrastructurePage() {
  return (
    <section className="page">
      <PageHeader
        title="Infrastructure"
        description="Placeholder for provider health, runtime services, and platform status once the read model is wired."
        eyebrow="Support surface"
      />
      <div className="panel">Provider health / runtime services / platform diagnostics</div>
    </section>
  );
}
