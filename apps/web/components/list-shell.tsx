import { DataState } from '@/components/data-state';
import { PageHeader } from '@/components/page-header';

export function ListShell({
  title,
  description,
  columns,
  rows,
  state,
}: {
  title: string;
  description: string;
  columns: string[];
  rows: string[][];
  state?: {
    title: string;
    message: string;
    tone?: 'neutral' | 'info' | 'loading' | 'empty' | 'warning' | 'error';
  };
}) {
  return (
    <div className="page">
      <PageHeader
        title={title}
        description={description}
        actions={<span className="badge">reference surface</span>}
      />

      {state ? <DataState title={state.title} message={state.message} tone={state.tone} /> : null}

      <section className="card">
        <table className="table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row, index) => (
                <tr key={`${title}-${index}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${title}-${index}-${cellIndex}`}>{cell}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length}>
                  <DataState
                    title="No rows yet"
                    message="This view is wired into the shell, but its dedicated read model has not landed yet."
                    tone="empty"
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
