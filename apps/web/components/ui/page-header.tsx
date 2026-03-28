export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <header style={{ marginBottom: 20 }}>
      <h2 style={{ marginBottom: 6 }}>{title}</h2>
      <p className="muted" style={{ margin: 0 }}>{description}</p>
    </header>
  );
}
