export async function Topbar() {
  return (
    <div className="topbar">
      <div>
        <span className="badge">local</span>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <span className="badge">admin</span>
        <span className="badge">live: scaffolded</span>
      </div>
    </div>
  );
}
