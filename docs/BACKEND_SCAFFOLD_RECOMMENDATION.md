# BACKEND_SCAFFOLD_RECOMMENDATION

## Purpose
Give Mission Control a pragmatic backend/platform scaffold that matches the already-accepted MVP stack, keeps momentum from the existing WP1 monorepo foundation, and reduces drift before WP2/WP3 start in earnest.

This recommendation is intentionally biased toward **shipping a launchable MVP**, not building a perfectly abstract control-plane platform on day one.

---

## Executive recommendation

Keep the current monorepo direction:
- `apps/api` remains the single Fastify backend for MVP
- `packages/shared` remains the cross-app contract package
- add a top-level `database/` area to make migrations, seeds, and SQL read-model work explicit instead of burying all persistence concerns inside `apps/api`
- use **Prisma for schema/client + SQL migration files for authority + targeted raw SQL for heavy reads**
- use **WebSocket as the primary live transport**, but implement it as a **simple server-push channel with topic-based subscription and REST re-fetch fallback**, not a complex event bus protocol

The key move from here is to separate:
1. **transport and HTTP concerns** (`apps/api`)
2. **shared contracts** (`packages/shared`)
3. **database authority and SQL assets** (`database/`)
4. **state-change fanout for live updates** (thin internal publisher in `apps/api` backed by Redis pub/sub later if needed)

---

## Why this shape is the right MVP compromise

The repo already has the right stack direction locked in:
- Fastify
- Prisma
- shared TypeScript contracts
- PostgreSQL
- Redis
- WebSocket

What is still missing is a scaffold that makes backend work easy to divide and easy to extend without turning `apps/api` into one giant folder of routes plus ad hoc queries.

My recommendation is:
- keep implementation simple enough for a single team to move fast
- avoid introducing extra services or event infrastructure before needed
- make schema and migration assets clearly visible at repo level
- define module seams now so WP2/WP3/WP4 can proceed without reorganizing the codebase mid-flight

---

## Recommended target structure

```text
mission-control/
├─ apps/
│  ├─ api/
│  │  ├─ prisma/
│  │  │  └─ schema.prisma
│  │  └─ src/
│  │     ├─ app.ts
│  │     ├─ server.ts
│  │     ├─ config/
│  │     │  ├─ env.ts
│  │     │  └─ logger.ts
│  │     ├─ lib/
│  │     │  ├─ errors.ts
│  │     │  ├─ db.ts
│  │     │  ├─ pagination.ts
│  │     │  ├─ time.ts
│  │     │  └─ ids.ts
│  │     ├─ plugins/
│  │     │  ├─ prisma.ts
│  │     │  ├─ redis.ts
│  │     │  ├─ auth.ts
│  │     │  └─ live.ts
│  │     ├─ routes/
│  │     │  ├─ health.ts
│  │     │  └─ api/v1/
│  │     │     ├─ index.ts
│  │     │     ├─ me.ts
│  │     │     ├─ overview.ts
│  │     │     ├─ agents.ts
│  │     │     ├─ tasks.ts
│  │     │     ├─ workflows.ts
│  │     │     ├─ alerts.ts
│  │     │     ├─ commands.ts
│  │     │     ├─ observability.ts
│  │     │     ├─ infrastructure.ts
│  │     │     ├─ costs.ts
│  │     │     ├─ ingest.ts
│  │     │     └─ live.ts
│  │     ├─ modules/
│  │     │  ├─ overview/
│  │     │  │  ├─ service.ts
│  │     │  │  └─ repository.ts
│  │     │  ├─ agents/
│  │     │  │  ├─ service.ts
│  │     │  │  ├─ repository.ts
│  │     │  │  ├─ queries.sql.ts
│  │     │  │  └─ live.ts
│  │     │  ├─ tasks/
│  │     │  ├─ workflows/
│  │     │  ├─ alerts/
│  │     │  ├─ commands/
│  │     │  ├─ events/
│  │     │  ├─ logs/
│  │     │  ├─ metrics/
│  │     │  ├─ costs/
│  │     │  ├─ infrastructure/
│  │     │  ├─ governance/
│  │     │  └─ ingest/
│  │     │     ├─ service.ts
│  │     │     ├─ state-reconciler.ts
│  │     │     └─ idempotency.ts
│  │     └─ workers/
│  │        ├─ heartbeat-reconciler.ts
│  │        ├─ alert-evaluator.ts
│  │        └─ command-dispatcher.ts
│  └─ web/
├─ packages/
│  └─ shared/
│     └─ src/
│        ├─ contracts/
│        │  ├─ common.ts
│        │  ├─ pagination.ts
│        │  ├─ filters.ts
│        │  └─ errors.ts
│        ├─ auth/
│        │  └─ me.ts
│        ├─ dto/
│        │  ├─ overview.ts
│        │  ├─ agents.ts
│        │  ├─ tasks.ts
│        │  ├─ workflows.ts
│        │  ├─ alerts.ts
│        │  ├─ commands.ts
│        │  ├─ costs.ts
│        │  ├─ infrastructure.ts
│        │  └─ observability.ts
│        ├─ live/
│        │  ├─ envelope.ts
│        │  ├─ topics.ts
│        │  ├─ events.ts
│        │  └─ subscriptions.ts
│        ├─ ingest/
│        │  ├─ agent-heartbeat.ts
│        │  ├─ task-state.ts
│        │  ├─ workflow-state.ts
│        │  ├─ event.ts
│        │  ├─ log.ts
│        │  ├─ metric.ts
│        │  ├─ cost-record.ts
│        │  └─ provider-health.ts
│        └─ index.ts
├─ database/
│  ├─ migrations/
│  │  ├─ 0001_init_enums.sql
│  │  ├─ 0002_core_tables.sql
│  │  ├─ 0003_observability_costs_alerts_governance.sql
│  │  ├─ 0004_indexes.sql
│  │  ├─ 0005_updated_at_triggers.sql
│  │  └─ 0006_seed_roles_and_users.sql
│  ├─ seeds/
│  │  ├─ dev_seed.ts
│  │  └─ fixtures/
│  │     ├─ users.json
│  │     ├─ agents.json
│  │     └─ workflows.json
│  ├─ queries/
│  │  ├─ overview.sql
│  │  ├─ costs.sql
│  │  ├─ alerts.sql
│  │  └─ infrastructure.sql
│  ├─ prisma/
│  │  └─ README.md
│  └─ README.md
└─ docs/
```

---

## Recommended responsibilities by area

### `apps/api`
Owns:
- Fastify boot
- route registration
- auth/RBAC enforcement
- request validation
- orchestration of services/repositories
- live connection management
- command pipeline and ingestion handlers
- background jobs that are still acceptable inside the single MVP API service

Should not become the long-term home for:
- raw migration SQL history
- seed fixture source of truth
- shared DTO/event schemas used by both API and web

### `database/migrations`
Owns:
- authoritative SQL migration history
- explicit schema evolution order
- seed/bootstrap SQL for baseline users/roles if needed
- hand-written indexes/triggers that should not be hidden in ORM-generated output

### `packages/shared`
Owns:
- DTOs consumed by API and web
- Zod schemas for inbound/outbound payloads
- shared enums/status values
- live event envelopes and subscription shapes
- ingestion payload contracts

Should not own:
- Prisma models
- database-specific query helpers
- API-only service logic

### Live update transport
Owns:
- thin WebSocket connection layer
- topic subscriptions
- server push events for changed state
- reconnect-safe payloads that tell the client what changed

Should explicitly avoid, for MVP:
- full event replay engine
- durable stream semantics
- complicated per-widget protocol design

---

## Concrete `apps/api` scaffold recommendation

### 1. Route layout
Keep routes shallow and predictable. One route file per resource group.

Recommended first route files under `apps/api/src/routes/api/v1/`:
- `me.ts`
- `overview.ts`
- `agents.ts`
- `tasks.ts`
- `workflows.ts`
- `alerts.ts`
- `commands.ts`
- `observability.ts`
- `costs.ts`
- `infrastructure.ts`
- `ingest.ts`
- `live.ts`

This keeps API discovery obvious and mirrors `docs/API_V1.md` cleanly.

### 2. Module layout
Each domain module should expose:
- `service.ts` — business logic and orchestration
- `repository.ts` — Prisma and SQL access
- `live.ts` — event publication helpers if the module emits live updates
- optionally `queries.sql.ts` — named SQL snippets for list/detail/aggregate queries

The first modules worth creating for real are:
- `overview`
- `agents`
- `tasks`
- `workflows`
- `alerts`
- `commands`
- `ingest`

### 3. Repository pattern
Do not create a generic mega-repository abstraction. It usually slows teams down.

Use a simple pattern:
- Prisma for inserts/updates/simple lookups
- module-level SQL helpers for heavy list/detail/aggregate queries
- services compose repositories and publish live events

### 4. Background work inside MVP API
A separate worker service is not necessary yet. Instead, scaffold a `workers/` area and run lightweight loops/jobs in-process for MVP:
- heartbeat stale detection
- alert evaluation for obvious rules
- command dispatch polling/execution state transitions

If these grow later, they can become a dedicated worker app without reorganizing the domain logic.

---

## Concrete `database/migrations` recommendation

## Why add a top-level `database/` now
Right now the repo has Prisma only under `apps/api/prisma/`. That is fine for initial bootstrap, but it mixes API app concerns and persistence concerns too tightly.

For Mission Control, the database is foundational enough that its migration history should be legible at repo level.

## Recommendation
Keep `apps/api/prisma/schema.prisma` as the Prisma schema location for client generation, but treat `database/migrations/` as the human-readable migration ledger.

Pragmatic operating model:
- Prisma schema remains the typed source used by the app
- generated or hand-curated SQL migrations are committed under `database/migrations`
- API scripts call through to Prisma migrate, but docs and code review focus on the SQL files
- raw SQL views/indexes/triggers that Prisma does not model well live in `database/migrations`

## First migration cut
Use the DB spec’s own sequence, slightly tightened:

### `0001_init_enums.sql`
Create:
- agent/status/health enums
- task/workflow/priority enums
- event/log enums
- alert enums
- actor/command/key/role enums

### `0002_core_tables.sql`
Create:
- `agents`
- `workflows`
- `tasks`
- `workflow_task_dependencies`

### `0003_observability_costs_alerts_governance.sql`
Create:
- `events`
- `structured_logs`
- `agent_metric_snapshots`
- `cost_records`
- `provider_health_snapshots`
- `alerts`
- `control_commands`
- `users`
- `audit_logs`
- `api_key_inventory`

### `0004_indexes.sql`
Apply the index set from `docs/DB_SCHEMA_V1.md`

### `0005_updated_at_triggers.sql`
Create a shared trigger function and attach it to tables using `updated_at`

### `0006_seed_roles_and_users.sql`
Seed a safe local/dev baseline:
- admin user
- operator user
- viewer user
- auditor user
- optional `system` actor conventions documented in `database/README.md`

## Migration strategy recommendation

### Rule 1: migrations are append-only
No rewriting applied migrations once shared.

### Rule 2: schema follows docs, but docs stop being authoritative once migrations land
After WP2 starts, the database truth should be:
1. migration SQL
2. Prisma schema
3. docs updated to match

### Rule 3: prefer additive change during MVP
Add columns and tables rather than churn models aggressively.

### Rule 4: seed fixtures should be deterministic
Make dev/demo data re-runnable.

### Rule 5: put tricky read models in SQL early
Overview, cost rollups, and alert/infrastructure summaries are likely better as SQL sooner rather than later.

---

## Concrete `packages/shared` recommendation

The current shared package is correctly narrow, but it needs one level of expansion so backend and web can build against real contracts instead of placeholders.

## First files to add

### Contracts/common
- `pagination.ts`
  - `PageRequestSchema`
  - `PageInfoSchema`
  - `SortDirectionSchema`
- `filters.ts`
  - common time-range and search filters
- `errors.ts`
  - structured API error shape and codes

### DTOs
- `dto/agents.ts`
  - `AgentSummaryDto`
  - `AgentDetailDto`
  - `AgentEventDto`
  - `AgentMetricsPointDto`
- `dto/tasks.ts`
- `dto/workflows.ts`
- `dto/alerts.ts`
- `dto/commands.ts`
- `dto/costs.ts`
- `dto/infrastructure.ts`
- `dto/observability.ts`

### Live contracts
- `live/topics.ts`
  - topic names such as `overview`, `agents`, `agent:{id}`, `tasks`, `task:{id}`, etc.
- `live/events.ts`
  - event types from API spec
- `live/subscriptions.ts`
  - subscribe/unsubscribe payload shapes
- `live/envelope.ts`
  - canonical live event envelope

### Ingestion contracts
- `ingest/agent-heartbeat.ts`
- `ingest/task-state.ts`
- `ingest/workflow-state.ts`
- `ingest/event.ts`
- `ingest/log.ts`
- `ingest/metric.ts`
- `ingest/cost-record.ts`
- `ingest/provider-health.ts`

## DTO design guidance
Prefer:
- explicit UI-facing DTOs
- stable nullable fields
- top-level IDs and timestamps
- narrow summaries for list pages
- richer detail DTOs for drill-down

Avoid:
- leaking raw Prisma models directly to API responses
- “one DTO to rule them all” for both list and detail
- embedding giant observability arrays in detail endpoints unless paginated

---

## Live update transport recommendation

## Recommended MVP protocol
Use **WebSocket server push with topic subscriptions**.

### Connection
- endpoint: `/api/v1/live`
- authenticate using the same session/auth stub model as REST
- server sends `connection.ready`
- client sends a small subscribe message after connect

### Client subscribe example
```json
{
  "type": "subscribe",
  "topics": [
    "overview",
    "agents",
    "tasks",
    "alerts",
    "commands"
  ]
}
```

### Server event envelope
```json
{
  "type": "task.updated",
  "topic": "task:9ef1...",
  "ts": "2026-03-29T08:00:00Z",
  "sequence": 42,
  "data": {
    "taskId": "9ef1...",
    "status": "failed",
    "workflowId": "..."
  }
}
```

## Recommendation on payload style
For MVP, send **change notifications plus a useful summary payload**, not full denormalized entities every time.

Good examples:
- `task.updated` with `taskId`, `status`, `workflowId`, `assignedAgentId`
- `agent.updated` with `agentId`, `status`, `health`, `currentTaskId`
- `command.updated` with `commandId`, `status`, `targetType`, `targetId`
- `overview.updated` with refreshed counters only

This allows the web app to:
- patch easy surfaces directly
- re-fetch detail data when needed
- avoid complex event versioning in MVP

## Recommended topic set
- `overview`
- `agents`
- `agent:{agentId}`
- `tasks`
- `task:{taskId}`
- `workflows`
- `workflow:{workflowId}`
- `alerts`
- `alert:{alertId}`
- `commands`
- `command:{commandId}`
- `infrastructure`
- `costs`

## Publication triggers
Publish from these backend actions:
- task state change ingestion
- workflow state change ingestion
- agent heartbeat/status change ingestion
- alert create/update actions
- command create/update actions
- provider health updates
- overview aggregate changes that materially affect dashboard counters

## What not to do yet
Do not build, in MVP phase 1:
- replay-from-offset guarantees
- durable consumer groups
- cross-node ordering guarantees beyond a simple sequence/timestamp
- bespoke event sourcing machinery

## Recommended implementation path
Phase 1:
- in-process connection registry in API
- module services call `live.publish(...)`
- event sent directly to matching subscribers

Phase 2 if needed:
- Redis pub/sub fanout so multiple API instances can broadcast consistently

That matches the current stack and does not overbuild before multi-instance deployment is real.

---

## First endpoints to implement

The repo already has `GET /api/v1/me`, `GET /api/v1/overview`, and a live stub. The next useful endpoints should be selected for **operator usefulness + backend enablement**, not spec completeness.

## Slice 1: establish real read-side backbone

### Must implement first
- `GET /api/v1/me`
  - return seeded/dev user and role cleanly
- `GET /api/v1/overview`
  - source data from DB, even if initial values are sparse
- `GET /api/v1/agents`
- `GET /api/v1/agents/:agentId`
- `GET /api/v1/tasks`
- `GET /api/v1/tasks/:taskId`
- `GET /api/v1/workflows`
- `GET /api/v1/workflows/:workflowId`
- `GET /api/v1/alerts`
- `GET /api/v1/commands`

These give the web shell real surfaces quickly.

## Slice 2: enable ingestion and state freshness

### Must implement next
- `POST /api/v1/ingest/agents/heartbeat`
- `POST /api/v1/ingest/tasks/state`
- `POST /api/v1/ingest/workflows/state`
- `POST /api/v1/ingest/events`
- `POST /api/v1/ingest/logs`
- `POST /api/v1/ingest/metrics/agents`
- `POST /api/v1/ingest/costs`
- `POST /api/v1/ingest/providers/health`

These are not listed in `API_V1.md`, but they are implied by WP3 and should exist as internal/runtime ingestion APIs.

## Slice 3: first operator actions

### Implement after reads and ingestion are stable
- `POST /api/v1/agents/:agentId/commands/restart`
- `POST /api/v1/tasks/:taskId/commands/retry`
- `POST /api/v1/tasks/:taskId/commands/cancel`
- `POST /api/v1/workflows/:workflowId/commands/rerun`
- `GET /api/v1/commands/:commandId`

This is enough to prove the command pipeline without boiling the ocean.

---

## Data/reconciliation strategy recommendation

Mission Control needs a few derived fields to feel live and coherent. Do not try to compute everything on every page load.

## Fields to update eagerly on write/ingest

### Agents
Update directly when heartbeat/task assignment changes:
- `status`
- `health`
- `current_task_id`
- `last_heartbeat_at`
- `restart_count`

### Tasks
Update directly on task lifecycle transitions:
- `status`
- `assigned_agent_id`
- `started_at`
- `completed_at`
- `retry_count`
- `error`
- `output`

### Workflows
Update rollups on task transitions and cost ingestion:
- `status`
- `total_tasks`
- `completed_tasks`
- `failed_tasks`
- `total_cost_usd`
- `total_tokens`
- `started_at`
- `completed_at`

### Commands
Treat `control_commands` as the system of record for operator actions:
- insert pending command
- update approval/executing/result fields through the lifecycle
- emit live updates at each state transition
- write audit log entries for request + result

## Stale heartbeat policy
Start simple:
- > 60s without heartbeat: health becomes `warning` / agent may show degraded
- > 180s without heartbeat: mark `degraded` or `failed` based on agent type/runtime expectation

Implement this in a lightweight reconciler job first, not in every read query.

---

## 1-2 day execution slices

These are meant to be realistic for one backend/platform contributor, or a small pair, not theoretical sprint poetry.

## Slice A — 1 day
**Goal:** make the persistence scaffold real.

Ship:
- create `database/README.md`
- create migration file plan under `database/migrations/`
- expand Prisma schema from `RuntimeProbe` to real enums/tables for core entities first
- add migration/apply scripts at repo root and/or API package
- seed `users` and a tiny set of dev fixtures
- wire `GET /api/v1/me` to seeded data instead of a pure placeholder

Exit criteria:
- fresh local setup can create schema and seed data
- Prisma client can read real `users`, `agents`, `tasks`, `workflows`

## Slice B — 1 day
**Goal:** establish minimal but real read APIs.

Ship:
- `GET /api/v1/overview`
- `GET /api/v1/agents`
- `GET /api/v1/agents/:agentId`
- `GET /api/v1/tasks`
- `GET /api/v1/workflows`
- shared DTOs for those endpoints
- basic repository/query layer

Exit criteria:
- web shell can render overview and first list/detail pages from real DB data

## Slice C — 1 day
**Goal:** make runtime updates possible.

Ship:
- ingestion DTOs in `packages/shared`
- `POST /api/v1/ingest/agents/heartbeat`
- `POST /api/v1/ingest/tasks/state`
- `POST /api/v1/ingest/workflows/state`
- task/workflow/agent write-path reconciliation
- publish first live events from those writes

Exit criteria:
- ingesting state changes updates DB and pushes live notifications

## Slice D — 1 day
**Goal:** prove the live operator loop.

Ship:
- topic-based subscribe protocol on `/api/v1/live`
- `agent.updated`, `task.updated`, `workflow.updated`, `overview.updated`
- simple connection registry
- sequence counter / timestamp on envelopes
- REST re-fetch guidance documented for the web client

Exit criteria:
- UI can subscribe and react to real state changes without manual refresh

## Slice E — 1-2 days
**Goal:** prove safe operator action flow.

Ship:
- `control_commands` persistence
- `POST /api/v1/agents/:agentId/commands/restart`
- `POST /api/v1/tasks/:taskId/commands/retry`
- `GET /api/v1/commands`
- `GET /api/v1/commands/:commandId`
- audit log writes
- `command.updated` live event

Exit criteria:
- operator action is requested, recorded, advanced through status, and observable in UI/API

---

## Practical code-level recommendations

## Naming
Use resource-first naming matching the docs and routes:
- `AgentService`, `AgentRepository`
- `TaskService`, `TaskRepository`
- `LivePublisher`
- `CommandService`
- `IngestService`

## Validation
Use Zod in `packages/shared` for:
- request payload schemas
- response DTO schemas where helpful
- live event payload schemas

Fastify routes should validate at the edge and hand typed input to services.

## Error model
Adopt the spec’s structured envelope everywhere now:
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `VALIDATION_ERROR`
- `CONFLICT`
- `COMMAND_REJECTED`
- `RATE_LIMITED`
- `INTERNAL_ERROR`

## Auth/RBAC
For MVP scaffold:
- stub session resolution via header/env during local dev
- centralize role checks in API helpers
- do not scatter manual role string comparisons across route files

## SQL usage
Prefer raw SQL early for:
- overview aggregates
- alert list filters
- cost summaries/timeseries
- infra summary rollups
- workflow graph/dependency reads

This is exactly the class of workload where Prisma often gets awkward.

---

## Recommended immediate next changes to the repo

1. Add `docs/BACKEND_SCAFFOLD_RECOMMENDATION.md`
2. Add top-level `database/` directory with README and empty migration placeholders
3. Replace `RuntimeProbe`-only Prisma schema with Mission Control core models
4. Create real API module files for `agents`, `tasks`, `workflows`, `alerts`, `commands`, and `ingest`
5. Expand `packages/shared` with DTO/live/ingest contracts
6. Upgrade `/api/v1/live` from stub to topic-based push scaffold
7. Implement real DB-backed `me` + `overview` + first list endpoints

---

## Final recommendation
If the goal is a launchable MVP, the backend should evolve as:
- **one API app**
- **one Postgres database**
- **one shared contract package**
- **one simple WebSocket live layer**
- **clear separation between route code, domain services, and database authority**

That is enough structure to scale the codebase over the next work packages without trapping the team in premature platform architecture.
