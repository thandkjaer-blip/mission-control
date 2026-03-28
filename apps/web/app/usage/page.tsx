import { MetricCard } from '@/components/metric-card';
import { PageHeader } from '@/components/page-header';

export default function UsagePage() {
  return (
    <div className="page">
      <PageHeader
        title="Usage"
        description="Placeholder for burn, throughput, and unit-cost read models. This gives WP1 a home for later cost and usage surfaces."
      />

      <div className="grid metrics">
        <MetricCard label="Today spend" value="$184" hint="Projected from partial data" />
        <MetricCard label="Burn rate" value="$22/h" hint="Will later reflect provider + infra rollups" />
        <MetricCard label="Throughput" value="1.3k" hint="Requests handled in current window" />
      </div>

      <section className="card stack">
        <h3>Planned integrations</h3>
        <ul className="list">
          <li>Overview cost cards linking into filtered usage views</li>
          <li>Workflow and task-level cost drill-downs</li>
          <li>Provider consumption and anomaly hints</li>
        </ul>
      </section>
    </div>
  );
}
