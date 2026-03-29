import type { ProviderStatus } from '../contracts/statuses.js';
import type { RuntimeRefreshSnapshotDto } from './runtime.js';

export interface OverviewDto {
  agents: {
    total: number;
    idle: number;
    working: number;
    failed: number;
    degraded: number;
  };
  tasks: {
    pending: number;
    running: number;
    failed24h: number;
  };
  workflows: {
    running: number;
    failed24h: number;
  };
  cost: {
    currentBurnRateUsdPerHour: number;
    todayUsd: number;
  };
  infra: {
    status: ProviderStatus;
  };
  alerts: {
    open: number;
    critical: number;
  };
  providers: Array<{
    name: string;
    status: ProviderStatus;
  }>;
  runtime: {
    source: 'openclaw';
    projectedWorkflows: number;
    projectedAgents: number;
    projectedTasks: number;
    subagentAgents: number;
    latestRuntimeEventAt: string | null;
    lastRefresh: RuntimeRefreshSnapshotDto | null;
  };
  generatedAt: string;
}
