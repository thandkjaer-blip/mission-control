import { PageHeader } from '../../components/ui/page-header';

const cards = [
  ['Agents', '4 total'],
  ['Tasks', '3 running'],
  ['Workflows', '2 active'],
  ['Alerts', '1 critical'],
  ['Commands', '2 inflight']
];

export default function OverviewPage() {
  return (
    <section>
      <PageHeader title="Overview" description="Read-first overview shell with room for REST + WebSocket integration." />
      <div className="card-grid">
        {cards.map(([label, value]) => (
          <div key={label} className="card">
            <div className="muted">{label}</div>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
