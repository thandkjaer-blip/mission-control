export function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <section className="card">
      <p className="muted" style={{ margin: 0 }}>{label}</p>
      <div className="metric-value">{value}</div>
      <p className="muted" style={{ margin: 0 }}>{hint}</p>
    </section>
  );
}
