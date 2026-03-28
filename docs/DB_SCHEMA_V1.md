# MISSION_CONTROL_DB_SCHEMA_V1.md

## Formål
Definere et konkret PostgreSQL schema v1 for Mission Control Center.

Målet er at understøtte:
- agent management
- task orchestration
- workflows
- structured logs
- events
- alerts
- cost tracking
- auditability
- command execution

---

## Designprincipper
- PostgreSQL er source of truth for operationel state
- Metrics i høj volumen bør primært ligge i metrics-stack, men snapshots og aggregater kan spejles i DB
- Logs i høj volumen bør ligge i log-store; DB bruges til metadata, referencer og søgbare relationer hvor relevant
- Alle centrale entiteter skal kunne korreleres via IDs
- Tabellenavne holdes simple og auditérbare

---

## 1. Enums

```sql
CREATE TYPE agent_type AS ENUM ('programmer', 'uiux', 'po', 'graphic', 'infra');
CREATE TYPE agent_status AS ENUM ('idle', 'working', 'failed', 'stopped', 'degraded', 'starting');
CREATE TYPE health_status AS ENUM ('healthy', 'warning', 'critical');

CREATE TYPE task_status AS ENUM (
  'pending', 'queued', 'running', 'completed', 'failed', 'cancelled', 'blocked', 'retrying'
);
CREATE TYPE workflow_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled', 'partial');
CREATE TYPE trigger_type AS ENUM ('manual', 'schedule', 'event', 'api');
CREATE TYPE priority_level AS ENUM ('low', 'normal', 'high', 'critical');

CREATE TYPE dependency_type AS ENUM ('hard', 'soft');

CREATE TYPE event_severity AS ENUM ('info', 'warning', 'error', 'critical');
CREATE TYPE log_level AS ENUM ('debug', 'info', 'warn', 'error');

CREATE TYPE alert_type AS ENUM (
  'task_failed', 'agent_stuck', 'cost_spike', 'api_failure', 'infra_degraded', 'security_event'
);
CREATE TYPE alert_severity AS ENUM ('warning', 'critical');
CREATE TYPE alert_status AS ENUM ('open', 'acknowledged', 'resolved', 'suppressed');

CREATE TYPE actor_type AS ENUM ('user', 'system');
CREATE TYPE command_status AS ENUM ('pending', 'approved', 'executing', 'succeeded', 'failed', 'cancelled');
CREATE TYPE key_status AS ENUM ('active', 'rotating', 'revoked', 'error');
CREATE TYPE role_type AS ENUM ('admin', 'operator', 'viewer', 'auditor');
```

---

## 2. Core tables

## agents
```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type agent_type NOT NULL,
  version TEXT NOT NULL,
  status agent_status NOT NULL DEFAULT 'starting',
  health health_status NOT NULL DEFAULT 'healthy',
  current_task_id UUID NULL,
  worker_id TEXT NULL,
  last_heartbeat_at TIMESTAMPTZ NULL,
  started_at TIMESTAMPTZ NULL,
  restart_count INTEGER NOT NULL DEFAULT 0,
  success_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  avg_task_duration_ms BIGINT NOT NULL DEFAULT 0,
  total_tasks_completed BIGINT NOT NULL DEFAULT 0,
  token_usage_total BIGINT NOT NULL DEFAULT 0,
  cost_total_usd NUMERIC(14,6) NOT NULL DEFAULT 0,
  tags TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## workflows
```sql
CREATE TABLE workflows (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  status workflow_status NOT NULL DEFAULT 'pending',
  trigger_type trigger_type NOT NULL,
  initiated_by TEXT NOT NULL,
  started_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  total_tasks INTEGER NOT NULL DEFAULT 0,
  completed_tasks INTEGER NOT NULL DEFAULT 0,
  failed_tasks INTEGER NOT NULL DEFAULT 0,
  total_cost_usd NUMERIC(14,6) NOT NULL DEFAULT 0,
  total_tokens BIGINT NOT NULL DEFAULT 0,
  sla_class TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## tasks
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  workflow_id UUID NULL REFERENCES workflows(id) ON DELETE SET NULL,
  parent_task_id UUID NULL REFERENCES tasks(id) ON DELETE SET NULL,
  assigned_agent_id UUID NULL REFERENCES agents(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  priority priority_level NOT NULL DEFAULT 'normal',
  status task_status NOT NULL DEFAULT 'pending',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB NULL,
  error JSONB NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  created_by TEXT NOT NULL,
  due_at TIMESTAMPTZ NULL,
  started_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## workflow_task_dependencies
```sql
CREATE TABLE workflow_task_dependencies (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type dependency_type NOT NULL DEFAULT 'hard',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (task_id, depends_on_task_id)
);
```

---

## 3. Observability tables

## events
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  severity event_severity NOT NULL DEFAULT 'info',
  ts TIMESTAMPTZ NOT NULL,
  correlation_id TEXT NULL,
  trace_id TEXT NULL,
  workflow_id UUID NULL REFERENCES workflows(id) ON DELETE SET NULL,
  task_id UUID NULL REFERENCES tasks(id) ON DELETE SET NULL,
  agent_id UUID NULL REFERENCES agents(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## structured_logs
```sql
CREATE TABLE structured_logs (
  id UUID PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL,
  level log_level NOT NULL,
  service TEXT NOT NULL,
  agent_id UUID NULL REFERENCES agents(id) ON DELETE SET NULL,
  workflow_id UUID NULL REFERENCES workflows(id) ON DELETE SET NULL,
  task_id UUID NULL REFERENCES tasks(id) ON DELETE SET NULL,
  trace_id TEXT NULL,
  span_id TEXT NULL,
  message TEXT NOT NULL,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## agent_metric_snapshots
```sql
CREATE TABLE agent_metric_snapshots (
  id UUID PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ NOT NULL,
  cpu_pct NUMERIC(5,2) NULL,
  memory_mb NUMERIC(12,2) NULL,
  tokens_per_min NUMERIC(12,2) NULL,
  requests_per_min NUMERIC(12,2) NULL,
  avg_latency_ms NUMERIC(12,2) NULL,
  success_rate_window NUMERIC(5,2) NULL,
  queue_depth INTEGER NULL,
  active_tasks INTEGER NULL,
  cost_per_hour_usd NUMERIC(12,6) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 4. Cost tables

## cost_records
```sql
CREATE TABLE cost_records (
  id UUID PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  agent_id UUID NULL REFERENCES agents(id) ON DELETE SET NULL,
  workflow_id UUID NULL REFERENCES workflows(id) ON DELETE SET NULL,
  task_id UUID NULL REFERENCES tasks(id) ON DELETE SET NULL,
  prompt_tokens BIGINT NOT NULL DEFAULT 0,
  completion_tokens BIGINT NOT NULL DEFAULT 0,
  total_tokens BIGINT NOT NULL DEFAULT 0,
  cost_usd NUMERIC(14,6) NOT NULL DEFAULT 0,
  request_count INTEGER NOT NULL DEFAULT 1,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## provider_health_snapshots
```sql
CREATE TABLE provider_health_snapshots (
  id UUID PRIMARY KEY,
  provider TEXT NOT NULL,
  status TEXT NOT NULL,
  latency_ms NUMERIC(12,2) NULL,
  error_rate NUMERIC(6,3) NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ts TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 5. Alerting and command tables

## alerts
```sql
CREATE TABLE alerts (
  id UUID PRIMARY KEY,
  type alert_type NOT NULL,
  severity alert_severity NOT NULL,
  status alert_status NOT NULL DEFAULT 'open',
  source_id TEXT NULL,
  source_type TEXT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  triggered_at TIMESTAMPTZ NOT NULL,
  acknowledged_by TEXT NULL,
  acknowledged_at TIMESTAMPTZ NULL,
  resolved_at TIMESTAMPTZ NULL,
  runbook_url TEXT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  workflow_id UUID NULL REFERENCES workflows(id) ON DELETE SET NULL,
  task_id UUID NULL REFERENCES tasks(id) ON DELETE SET NULL,
  agent_id UUID NULL REFERENCES agents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## control_commands
```sql
CREATE TABLE control_commands (
  id UUID PRIMARY KEY,
  type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  requested_by TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status command_status NOT NULL DEFAULT 'pending',
  approval_required BOOLEAN NOT NULL DEFAULT FALSE,
  approval_reason TEXT NULL,
  approved_by TEXT NULL,
  approved_at TIMESTAMPTZ NULL,
  execution_started_at TIMESTAMPTZ NULL,
  execution_finished_at TIMESTAMPTZ NULL,
  execution_result JSONB NULL,
  error JSONB NULL,
  correlation_id TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 6. Governance tables

## users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role role_type NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## audit_logs
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  actor_id TEXT NOT NULL,
  actor_type actor_type NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_id TEXT NULL,
  before JSONB NULL,
  after JSONB NULL,
  reason TEXT NULL,
  result TEXT NOT NULL,
  ip_address INET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## api_key_inventory
```sql
CREATE TABLE api_key_inventory (
  id UUID PRIMARY KEY,
  provider TEXT NOT NULL,
  key_alias TEXT NOT NULL,
  last_used_at TIMESTAMPTZ NULL,
  status key_status NOT NULL DEFAULT 'active',
  usage_limit_usd NUMERIC(14,6) NULL,
  usage_current_usd NUMERIC(14,6) NULL,
  owner TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, key_alias)
);
```

---

## 7. Recommended indexes

```sql
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_type ON agents(type);
CREATE INDEX idx_agents_last_heartbeat ON agents(last_heartbeat_at DESC);

CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_workflows_created_at ON workflows(created_at DESC);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_workflow_id ON tasks(workflow_id);
CREATE INDEX idx_tasks_agent_id ON tasks(assigned_agent_id);
CREATE INDEX idx_tasks_priority_status ON tasks(priority, status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);

CREATE INDEX idx_events_ts ON events(ts DESC);
CREATE INDEX idx_events_workflow_id ON events(workflow_id);
CREATE INDEX idx_events_task_id ON events(task_id);
CREATE INDEX idx_events_agent_id ON events(agent_id);
CREATE INDEX idx_events_correlation_id ON events(correlation_id);
CREATE INDEX idx_events_event_type ON events(event_type);

CREATE INDEX idx_logs_ts ON structured_logs(ts DESC);
CREATE INDEX idx_logs_agent_id ON structured_logs(agent_id);
CREATE INDEX idx_logs_workflow_id ON structured_logs(workflow_id);
CREATE INDEX idx_logs_task_id ON structured_logs(task_id);
CREATE INDEX idx_logs_trace_id ON structured_logs(trace_id);

CREATE INDEX idx_metric_snapshots_agent_ts ON agent_metric_snapshots(agent_id, ts DESC);

CREATE INDEX idx_cost_records_ts ON cost_records(ts DESC);
CREATE INDEX idx_cost_records_agent_id ON cost_records(agent_id);
CREATE INDEX idx_cost_records_workflow_id ON cost_records(workflow_id);
CREATE INDEX idx_cost_records_provider_model ON cost_records(provider, model);

CREATE INDEX idx_alerts_status_severity ON alerts(status, severity);
CREATE INDEX idx_alerts_triggered_at ON alerts(triggered_at DESC);
CREATE INDEX idx_alerts_agent_id ON alerts(agent_id);
CREATE INDEX idx_alerts_task_id ON alerts(task_id);
CREATE INDEX idx_alerts_workflow_id ON alerts(workflow_id);

CREATE INDEX idx_control_commands_status ON control_commands(status);
CREATE INDEX idx_control_commands_target ON control_commands(target_type, target_id);
CREATE INDEX idx_control_commands_requested_at ON control_commands(requested_at DESC);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_type, target_id);
CREATE INDEX idx_audit_logs_ts ON audit_logs(ts DESC);
```

---

## 8. Recommended constraints and lifecycle rules

### Agent state
- `agents.current_task_id` skal nulstilles når task afsluttes eller canceles
- heartbeat stale threshold bør håndteres i applikationslaget og evt. materialiseres som health update

### Task state machine
Tilladte transitions bør håndhæves i service-laget:
- pending → queued → running → completed
- pending/queued/running → cancelled
- running → failed
- failed → retrying → queued
- blocked → queued hvis dependency løses

### Workflow rollups
`workflows.total_tasks`, `completed_tasks`, `failed_tasks`, `total_cost_usd`, `total_tokens` bør opdateres via orchestrator eller async aggregator.

---

## 9. Retention og partitioning

Anbefalet senere:
- partitionér `events`, `structured_logs`, `cost_records`, `audit_logs` på tid
- kort retention i varm storage, længere retention i billigere storage
- metrics holdes primært i Prometheus/long-term metrics backend

---

## 10. V1 migrationsplan
1. Opret enums
2. Opret core tables
3. Opret observability/cost/alerts/governance tables
4. Opret indexes
5. Seed standardroller og evt. systembrugere
6. Tilføj trigger eller app-logik for `updated_at`

---

## 11. Næste skridt
- Omsæt schema til migrations
- Definér DTOs og API contracts
- Aftal hvilke felter der er authoritative fra runtime vs derived via aggregater
