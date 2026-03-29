import { PageHeader } from '@/components/page-header';

export default function AuditPage() {
  return (
    <section className="page">
      <PageHeader
        title="Audit"
        description="Placeholder for governance, audit trail, and review-focused read surfaces."
        eyebrow="Support surface"
      />
      <div className="panel">Audit trail / governance review / compliance views</div>
    </section>
  );
}
