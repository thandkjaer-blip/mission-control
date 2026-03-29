# IMPLEMENTATION PLAN — NEXT 1–2 DAYS

## Purpose
Turn the current Mission Control docs and WP1 scaffold into a short, executable build sequence that gets the project from placeholder foundation to the first real MVP slice.

This plan assumes:
- WP1 scaffold already exists and is good enough to build on
- the next highest-value work is **WP2 schema + persistence** and the **first vertical slice of WP3/WP4**
- the goal for the next 1–2 days is not broad feature completion, but to create a working backend/data spine that the UI can immediately consume

---

## Current repo reality

### Already in place
- pnpm/turbo monorepo
- `apps/api` Fastify scaffold
- `apps/web` Next.js shell scaffold
- `packages/shared` contract package baseline
- Docker Compose for Postgres + Redis
- CI baseline
- Prisma wired, but only with a placeholder `RuntimeProbe` model
- stubbed `GET /api/v1/me`, `GET /api/v1/overview`, and WebSocket `/api/v1/live`

### Biggest gaps now
- `docs/DB_SCHEMA_V1.md` is **not** translated into Prisma schema/migrations yet
- shared DTO/contracts only cover the smallest WP1 surface
- API routes are still stub payloads, not backed by persistence
- no seed data for agents/tasks/workflows/alerts/commands/users
- no ingestion endpoints for heartbeats, events, logs, costs, or provider health
- web shell is still static placeholders, not wired to live API data

### Practical conclusion
The next 1–2 days should focus on a **thin but real operational slice**:
1. authoritative schema + migrations
2. seed/demo data
3. first read-backed overview/agents/tasks/workflows APIs
4. shared contract expansion
5. web shell wired to those APIs

That is the shortest path from “docs + scaffold” to “something operators can actually inspect and demo”.

---

## Recommended milestone sequence

## Milestone 1 — Lock the persistence spine (highest priority)
**Target:** first half-day

### Outcome
The repo has a real Prisma schema aligned with `docs/DB_SCHEMA_V1.md`, initial migrations, and seed data that bootstraps a believable local environment.

### Exact tasks
1. Replace placeholder `RuntimeProbe` model in `apps/api/prisma/schema.prisma` with MVP tables in implementation order:
   - enums
   - `users`
   - `agents`
   - `workflows`
   - `tasks`
   - `workflow_task_dependencies`
   - `events`
   - `structured_logs`
   - `agent_metric_snapshots`
   - `cost_records`
   - `provider_health_snapshots`
   - `alerts`
   - `control_commands`
   - `audit_logs`
   - `api_key_inventory`
2. Map naming carefully so Prisma model names stay readable while table names remain faithful to DB spec.
3. Add indexes from `docs/DB_SCHEMA_V1.md`.
4. Decide and document schema adaptations required by Prisma/Postgres, especially:
   - enum naming
   - self-references on tasks
   - JSON fields
   - numeric precision fields
5. Generate the first real migration.
6. Rewrite `apps/api/prisma/seed.ts` to create:
   - 4 users (`admin`, `operator`, `viewer`, `auditor`)
   - 4–6 agents across types/statuses
   - 2–3 workflows
   - 8–12 tasks with a few dependencies and failure states
   - representative alerts, commands, logs, events, costs, provider health snapshots
7. Add a small seed note in docs/ or README describing what demo data exists.

### Repo structure decisions
- Keep **all authoritative DB schema and migrations inside `apps/api/prisma/`**.
- Do **not** move DB concerns into `packages/shared`.
- Add a new folder now: `apps/api/src/modules/_shared/` for reusable query helpers, pagination parsing, and status/count utilities.

### Definition of done
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:seed`
- API boots against seeded Postgres with no placeholder-only schema left

---

## Milestone 2 — Expand shared contracts to match the first real slice
**Target:** same day, after migrations are stable

### Outcome
`packages/shared` becomes the real contract boundary for the next work, instead of only holding WP1 stubs.

### Exact tasks
1. Add shared contract files for:
   - `agents`
   - `tasks`
   - `workflows`
   - `alerts`
   - `commands`
   - pagination/query primitives
2. Define the first real DTOs needed immediately:
   - `AgentSummaryDto`
   - `AgentDetailDto` (minimal)
   - `TaskSummaryDto`
   - `TaskDetailDto` (minimal)
   - `WorkflowSummaryDto`
   - `WorkflowDetailDto` (minimal)
   - `AlertDto`
   - `CommandDto`
3. Add typed filter contracts for the first list endpoints:
   - agents list filters
   - tasks list filters
   - workflows list filters
4. Add live event payload types for:
   - `agent.updated`
   - `task.updated`
   - `workflow.updated`
   - `alert.updated`
   - `command.updated`
   - `overview.updated`
5. Add ingestion input placeholders in a more deliberate shape, even if handlers are not yet fully built.

### Repo structure decisions
Inside `packages/shared/src/`, move from the current tiny baseline to this stable shape:
- `contracts/common.ts`
- `contracts/pagination.ts`
- `contracts/filters.ts`
- `dto/overview.ts`
- `dto/agents.ts`
- `dto/tasks.ts`
- `dto/workflows.ts`
- `dto/alerts.ts`
- `dto/commands.ts`
- `live/events.ts`
- `ingestion/*.ts` (new folder)

### Definition of done
- both `apps/api` and `apps/web` import real DTO/filter types from `@mission-control/shared`
- no ad hoc duplicated request/response shapes in app code for the first implemented surfaces

---

## Milestone 3 — Replace stubbed read APIs with database-backed MVP reads
**Target:** rest of day 1 / early day 2

### Outcome
The backend exposes the first real read model slice for overview, agents, tasks, and workflows.

### Exact tasks
1. Create query modules in `apps/api/src/modules/`:
   - `overview/`
   - `agents/`
   - `tasks/`
   - `workflows/`
2. In each module, separate:
   - repository/query code
   - DTO mapping
   - route registration
3. Implement these endpoints first:
   - `GET /api/v1/overview`
   - `GET /api/v1/agents`
   - `GET /api/v1/agents/:agentId`
   - `GET /api/v1/tasks`
   - `GET /api/v1/tasks/:taskId`
   - `GET /api/v1/workflows`
   - `GET /api/v1/workflows/:workflowId`
4. Use Prisma for straightforward reads, but allow raw SQL for overview aggregates if cleaner.
5. Add pagination/filter handling for list endpoints.
6. Add integration tests around:
   - overview counts
   - agent filtering by status/type
   - task filtering by status/workflow/agent
   - workflow filtering by status/trigger type
   - 404 behavior for missing detail routes
7. Keep `GET /api/v1/me` stubbed for now; do not let auth work derail this slice.

### Repo structure decisions
Use this module pattern consistently now:
- `apps/api/src/modules/<domain>/service.ts` — query logic
- `apps/api/src/modules/<domain>/mapper.ts` — Prisma/entity -> DTO
- `apps/api/src/modules/<domain>/routes.ts` — route definitions
- `apps/api/src/modules/<domain>/types.ts` — local-only helper types if needed

Then keep `apps/api/src/routes/api.ts` as a thin top-level registrar only, not a dumping ground.

### Definition of done
- list/detail routes return seeded data from Postgres
- overview is derived from actual tables, not hardcoded objects
- tests prove the slice works end-to-end against the local DB

---

## Milestone 4 — Wire the web shell to live API reads
**Target:** day 2 after Milestone 3 is working

### Outcome
The placeholder operator shell becomes a real read-only MVP shell for the core entities.

### Exact tasks
1. Add a small API client layer in `apps/web/lib/`:
   - `api.ts`
   - `queries/overview.ts`
   - `queries/agents.ts`
   - `queries/tasks.ts`
   - `queries/workflows.ts`
2. Replace static cards on `/overview` with data from `GET /api/v1/overview`.
3. Build initial list rendering for:
   - `/agents`
   - `/tasks`
   - `/workflows`
4. Build minimal detail pages for:
   - `/agents/[agentId]`
   - `/tasks/[taskId]`
   - `/workflows/[workflowId]`
5. Show the most useful fields only:
   - status
   - key links between entities
   - timing / counts
   - failure/alert context where available
6. Keep visual scope tight; prefer usable tables/cards over polish.
7. Treat live updates as follow-up enhancement on top of real REST reads if time gets tight.

### Repo structure decisions
Add and keep this frontend shape now:
- `apps/web/app/agents/[agentId]/page.tsx`
- `apps/web/app/tasks/[taskId]/page.tsx`
- `apps/web/app/workflows/[workflowId]/page.tsx`
- `apps/web/components/entities/` for reusable entity summary blocks
- `apps/web/components/table/` for list rendering primitives
- `apps/web/lib/api/` or `apps/web/lib/queries/` for fetchers

Do **not** overbuild a design system yet.

### Definition of done
- operator can click through Overview -> list -> detail on real data
- entity cross-links work
- the shell is visibly backed by the API, not placeholders

---

## Milestone 5 — Start the ingestion path with the smallest useful payloads
**Target:** if time remains in day 2, otherwise becomes the next handoff item

### Outcome
Mission Control starts receiving runtime-shaped writes instead of only relying on seed/demo data.

### Exact tasks
1. Add shared ingestion schemas for:
   - agent heartbeat/state update
   - task state transition
   - workflow state transition
   - event input
2. Implement first ingestion endpoints in `apps/api`:
   - `POST /api/v1/ingest/agent-heartbeats`
   - `POST /api/v1/ingest/task-transitions`
   - `POST /api/v1/ingest/workflow-transitions`
   - `POST /api/v1/ingest/events`
3. Add validation, timestamps, correlation ID handling.
4. Implement minimal reconciliation logic:
   - agent last heartbeat + status update
   - task status transitions
   - workflow aggregate counts refresh on task changes where feasible
5. Publish simple live events when writes succeed.

### Important constraint
Do not attempt the entire WP3 matrix in one pass. Start with the smallest operational loop that can update overview + entity detail pages.

---

## Recommended delegation map

### Track A — Data and persistence (must go first)
**Owner:** backend/data
- Prisma schema translation
- migrations
- seed data
- DB test fixtures

### Track B — Shared contracts
**Owner:** backend/platform
- DTO/filter/live event types
- ingestion payload schemas
- shared pagination/error primitives

### Track C — Read API slice
**Owner:** backend/API
- overview/agents/tasks/workflows query modules
- route wiring
- mapper cleanup
- integration tests

### Track D — Web read shell
**Owner:** frontend
- replace placeholders with real fetches
- list/detail pages
- entity linking and basic empty/loading states

### Track E — Ingestion starter
**Owner:** backend/runtime
- heartbeat/task/workflow/event ingestion endpoints
- minimal state reconciliation
- live event publication hooks

Recommended order of operations:
1. Track A starts immediately
2. Track B overlaps once schema field shapes are clear
3. Track C begins as soon as seeded schema exists
4. Track D starts once first list/detail endpoints are stable
5. Track E starts only after Track A/C have created a trustworthy read model baseline

---

## What to explicitly defer for now
To keep the next 1–2 days sharp, defer these unless core work finishes early:
- full alerts lifecycle APIs
- command execution pipeline
- infra and cost deep-dive screens
- RBAC beyond current dev stub + role-aware UI placeholders
- audit views
- advanced workflow graph visualization
- full WebSocket subscription semantics
- complete observability search surfaces (`/logs`, `/events`, correlations)

These matter, but they are not the shortest path to an MVP slice.

---

## Concrete task list in recommended execution order

1. Translate DB schema into Prisma models and enums
2. Generate first real migration
3. Build realistic seed/demo dataset
4. Expand shared DTO/filter/live contracts
5. Refactor API route registration into domain modules
6. Implement DB-backed overview endpoint
7. Implement agents list/detail endpoints
8. Implement tasks list/detail endpoints
9. Implement workflows list/detail endpoints
10. Add integration tests for those endpoints
11. Wire overview page to REST data
12. Wire agents/tasks/workflows list pages
13. Add minimal detail pages with entity cross-links
14. If time remains, implement first ingestion endpoints and simple live event emission

---

## Success criteria for the next 1–2 days
This plan succeeds if, by the end of the window, the repo has:
- a real Prisma/Postgres schema matching the MVP docs closely enough to build on
- repeatable local migrations + seed data
- the first database-backed API slice for overview/agents/tasks/workflows
- the web shell consuming those APIs instead of placeholders
- a clear handoff into broader WP3 ingestion, commands, alerts, and live updates

That would move Mission Control from “foundation exists” to “real MVP slice is executable”.
