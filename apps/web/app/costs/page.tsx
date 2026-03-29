import { PageHeader } from '@/components/page-header';

export default function CostsPage() {
  return (
    <section className="page">
      <PageHeader
        title="Costs"
        description="Placeholder for burn rate, spend summaries, and workflow/task cost drill-downs."
        eyebrow="Support surface"
      />
      <div className="panel">Burn rate / daily totals / cost drill-downs</div>
    </section>
  );
}
