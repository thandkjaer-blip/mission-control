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
    status: 'healthy' | 'degraded' | 'down';
  };
  alerts: {
    open: number;
    critical: number;
  };
  providers: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'down';
  }>;
  generatedAt: string;
}
