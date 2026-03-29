export interface RuntimeRefreshSnapshotDto {
  refreshedAt: string;
  workflows: number;
  agents: number;
  tasks: number;
  events: number;
  indexPath: string | null;
  sourceRoot: string | null;
}

export interface RuntimeSourceDto {
  source: 'openclaw';
  refreshEnabled: boolean;
  indexPath: string;
  indexExists: boolean;
  sourceRoot: string | null;
  sourceRootExists: boolean | null;
  configuredVia: {
    indexPath: 'env' | 'default';
    sourceRoot: 'env' | 'default';
  };
  lastRefresh: RuntimeRefreshSnapshotDto | null;
}

export interface RuntimeRefreshResultDto {
  ok: true;
  source: RuntimeSourceDto;
  workflows: number;
  agents: number;
  tasks: number;
  events: number;
  refreshedAt: string;
}
