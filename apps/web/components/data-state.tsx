export function DataState({
  title,
  message,
  tone = 'neutral',
}: {
  title: string;
  message: string;
  tone?: 'neutral' | 'warning';
}) {
  return (
    <section className={`card data-state ${tone === 'warning' ? 'data-state-warning' : ''}`}>
      <strong>{title}</strong>
      <p className="muted">{message}</p>
    </section>
  );
}
