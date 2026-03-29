'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { RuntimeRefreshResultDto, RuntimeSourceDto } from '@mission-control/shared';
import { ApiClientError, refreshRuntimeSource } from '@/lib/api';

export function RuntimeRefreshCard({ source }: { source: RuntimeSourceDto }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<RuntimeRefreshResultDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = () => {
    setError(null);

    startTransition(async () => {
      try {
        const next = await refreshRuntimeSource();
        setResult(next);
        router.refresh();
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : 'Runtime refresh failed.');
      }
    });
  };

  return (
    <section className="card data-state data-state-info">
      <div className="data-state-header">
        <span className="badge">OpenClaw runtime</span>
        <strong>Real-data refresh</strong>
      </div>
      <p className="muted">
        Mission Control can refresh from the live OpenClaw session index instead of relying on a one-off manual import.
      </p>
      <div className="data-state-detail muted">
        <div><strong>Index</strong>: {source.indexPath}</div>
        <div><strong>Index status</strong>: {source.indexExists ? 'present' : 'missing'}</div>
        {source.sourceRoot ? <div><strong>Source root</strong>: {source.sourceRoot} ({source.sourceRootExists ? 'present' : 'missing'})</div> : null}
        <div><strong>Refresh API</strong>: {source.refreshEnabled ? 'enabled' : 'disabled'}</div>
        {source.lastRefresh ? (
          <div><strong>Last refresh</strong>: {source.lastRefresh.refreshedAt} ({source.lastRefresh.workflows} workflows / {source.lastRefresh.agents} agents / {source.lastRefresh.tasks} tasks / {source.lastRefresh.events} events)</div>
        ) : (
          <div><strong>Last refresh</strong>: none yet</div>
        )}
      </div>
      <div className="data-state-actions">
        <button className="button primary" onClick={handleRefresh} disabled={isPending || !source.refreshEnabled || !source.indexExists}>
          {isPending ? 'Refreshing…' : 'Refresh from OpenClaw'}
        </button>
        {result ? (
          <span className="badge">
            imported {result.workflows} workflows / {result.events} events
          </span>
        ) : null}
      </div>
      {error ? <div className="data-state-detail" style={{ color: 'var(--danger)' }}>{error}</div> : null}
    </section>
  );
}
