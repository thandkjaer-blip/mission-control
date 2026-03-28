# WP1 Foundation and Scaffolding

## Purpose
Turn `docs/WORK_PACKAGES.md` WP1 into a concrete implementation start for the backend/platform side of Mission Control.

This document deliberately focuses on:
- `apps/api`
- `packages/shared`
- `infra/`
- local development and CI baseline

It is grounded in:
- `docs/ARCHITECTURE.md`
- `docs/API_V1.md`
- `docs/DB_SCHEMA_V1.md`
- `docs/WORK_PACKAGES.md`

---

## WP1 decisions to lock now

### Monorepo shape
Use a single TypeScript monorepo with `pnpm` workspaces.

Why:
- simplest way to share DTOs/contracts/constants between API and web
- fast local iteration for MVP
- one lockfile and one CI pipeline
- good fit for small team + rapid scaffolding

### Backend framework
Use **Fastify** for `apps/api`.

Why:
- explicitly suggested in `docs/ARCHITECTURE.md`
- lightweight and fast for read-heavy control-plane APIs
- easy health routes, plugins, validation hooks, and SSE/WebSocket support
- lower ceremony than NestJS for an MVP where the domain model is still settling

### Validation / contracts
Use **Zod** for runtime validation and shared schemas.

Why:
- lets `packages/shared` define DTOs and request/response contracts once
- useful for ingestion payload validation in WP3
- keeps API implementation and contract package aligned

### DB access and migrations
Use **Drizzle ORM + drizzle-kit** against PostgreSQL.

Why:
- close to SQL, which matches the concrete schema work in `docs/DB_SCHEMA_V1.md`
- easier to express exact enums, indexes, and migration intent than a more abstract ORM
- good fit for a control-plane backend where query clarity matters

### Realtime transport
Use **SSE first** for `/api/v1/live` in MVP.

Why:
- `docs/API_V1.md` allows WebSocket or SSE
- current live requirements are server -> client updates, not bi-directional messaging
- simpler auth, infra, and local debugging than WebSockets
- can be upgraded later if command streaming or rich subscriptions demand it

### Queue / bus for local dev
Use **Redis** in local development for command/event fanout scaffolding.

Why:
- explicitly acceptable in `docs/ARCHITECTURE.md` (`Redis eller NATS`)
- easiest thing to stand up alongside Postgres in Docker Compose
- sufficient for MVP command pipeline scaffolding and background worker hooks

### Test/tooling baseline
Use:
- **Vitest** for unit/integration tests
- **ESLint** + **Prettier** for lint/format
- **tsx** for TypeScript dev entrypoints
- **Turborepo** for build/lint/test/dev orchestration

Why:
- keeps the workspace fast and consistent
- gives a clean path to CI from day one

---

## Proposed repo layout

```text
mission-control/
├─ apps/
│  ├─ api/
│  │  ├─ src/
│  │  │  ├─ app.ts
│  │  │  ├─ server.ts
│  │  │  ├─ config/
│  │  │  │  ├─ env.ts
│  │  │  │  └─ logger.ts
│  │  │  ├─ plugins/
│  │  │  │  ├─ db.ts
│  │  │  │  ├─ auth.ts
│  │  │  │  ├─ redis.ts
│  │  │  │  └─ sse.ts
│  │  │  ├─ routes/
│  │  │  │  ├─ health.ts
│  │  │  │  ├─ me.ts
│  │  │  │  ├─ overview.ts
│  │  │  │  └─ live.ts
│  │  │  ├─ lib/
│  │  │  │  ├─ errors.ts
│  │  │  │  ├─ pagination.ts
│  │  │  │  ├─ request-context.ts
│  │  │  │  └─ time.ts
│  │  │  ├─ modules/
│  │  │  │  ├─ overview/
│  │  │  │  ├─ agents/
│  │  │  │  ├─ tasks/
│  │  │  │  ├─ workflows/
│  │  │  │  ├─ alerts/
│  │  │  │  ├─ commands/
│  │  │  │  ├─ observability/
│  │  │  │  ├─ costs/
│  │  │  │  ├─ infrastructure/
│  │  │  │  └─ governance/
│  │  │  └─ repositories/
│  │  ├─ drizzle/
│  │  │  ├─ schema/
│  │  │  ├─ migrations/
│  │  │  └─ seeds/
│  │  ├─ test/
│  │  │  ├─ helpers/
│  │  │  ├─ integration/
│  │  │  └─ fixtures/
│  │  ├─ package.json
│  │  └─ tsconfig.json
│  └─ web/
│     └─ (future WP1/WP6 scaffold consuming packages/shared)
├─ packages/
│  ├─ shared/
│  │  ├─ src/
│  │  │  ├─ index.ts
│  │  │  ├─ constants/
│  │  │  │  ├─ roles.ts
│  │  │  │  ├─ statuses.ts
│  │  │  │  └─ event-types.ts
│  │  │  ├─ dto/
│  │  │  │  ├─ overview.ts
│  │  │  │  ├─ agents.ts
│  │  │  │  ├─ tasks.ts
│  │  │  │  ├─ workflows.ts
│  │  │  │  ├─ alerts.ts
│  │  │  │  ├─ commands.ts
│  │  │  │  ├─ costs.ts
│  │  │  │  ├─ infrastructure.ts
│  │  │  │  └─ governance.ts
│  │  │  ├─ contracts/
│  │  │  │  ├─ api/
│  │  │  │  ├─ ingestion/
│  │  │  │  └─ live/
│  │  │  ├─ schemas/
│  │  │  │  ├─ common.ts
│  │  │  │  ├─ ids.ts
│  │  │  │  └─ pagination.ts
│  │  │  └─ types/
│  │  ├─ package.json
│  │  └─ tsconfig.json
├─ infra/
│  ├─ docker/
│  │  ├─ docker-compose.yml
│  │  ├─ postgres/
│  │  │  └─ init/
│  │  └─ redis/
│  ├─ env/
│  │  ├─ api.env.example
│  │  ├─ web.env.example
│  │  └─ db.env.example
│  ├─ scripts/
│  │  ├─ dev-up.sh
│  │  ├─ dev-down.sh
│  │  ├─ db-reset.sh
│  │  └─ wait-for-postgres.sh
│  └─ ci/
│     └─ github-actions-ci.yml
├─ docs/
│  ├─ ARCHITECTURE.md
│  ├─ API_V1.md
│  ├─ DB_SCHEMA_V1.md
│  ├─ WORK_PACKAGES.md
│  └─ WP1_FOUNDATION.md
├─ package.json
├─ pnpm-workspace.yaml
├─ turbo.json
├─ tsconfig.base.json
├─ .gitignore
├─ .editorconfig
├─ .env.example
└─ README.md
```

---

## Responsibilities by area

## `apps/api`
Mission Control backend API and future ingestion/control-plane runtime.

Initial responsibilities in WP1:
- boot Fastify server
- expose `GET /healthz` and `GET /readyz`
- expose stub `GET /api/v1/me`
- expose stub `GET /api/v1/overview`
- expose stub `GET /api/v1/live` via SSE
- load typed environment config
- register DB and Redis plugins
- standardize error model to match `docs/API_V1.md`

Target internal shape:
- `routes/` for transport layer
- `modules/` for domain-specific query/command logic
- `repositories/` for Drizzle query adapters
- `plugins/` for infrastructure wiring

This gives WP2-WP4 a clean landing zone without prematurely over-abstracting.

## `packages/shared`
Authoritative shared contracts package.

Initial responsibilities in WP1:
- shared enum/constants mirror for statuses and roles from `docs/DB_SCHEMA_V1.md`
- common DTOs from `docs/API_V1.md`
- common pagination/error schemas
- live event envelope types for SSE
- ingestion payload skeletons for WP3

Rule of thumb:
- if both web and API need it, it belongs here
- DB-only schema definitions stay in `apps/api`
- UI-only presentation types stay in `apps/web`

## `infra/`
Local environment, CI support, and repo-level scripts.

Initial responsibilities in WP1:
- Docker Compose for Postgres and Redis
- example env files
- DB reset / start / stop helper scripts
- CI workflow baseline: install, lint, typecheck, test, build

Avoid in WP1:
- Kubernetes manifests
- production Helm charts
- elaborate Terraform

WP1 is about getting the team unblocked locally.

---

## API skeleton to create first

These endpoints are enough to prove the scaffold works:

### Health
- `GET /healthz`
- `GET /readyz`

Suggested responses:

```json
{ "status": "ok" }
```

and

```json
{
  "status": "ready",
  "checks": {
    "postgres": "ok",
    "redis": "ok"
  }
}
```

### API v1 bootstrap
- `GET /api/v1/me`
- `GET /api/v1/overview`
- `GET /api/v1/live`

WP1 does not need full business data. It needs stable route shapes and DTO placeholders.

---

## Shared contracts to create immediately

Start `packages/shared` with these exports:

### Common
- `ApiError`
- `PaginatedResult<T>`
- `HealthStatus`
- `RoleType`
- `AgentStatus`
- `TaskStatus`
- `WorkflowStatus`
- `AlertStatus`
- `CommandStatus`

### DTOs aligned with `docs/API_V1.md`
- `MeDto`
- `OverviewDto`
- `AgentSummaryDto`
- `AgentDetailDto`
- `TaskSummaryDto`
- `TaskDetailDto`
- `WorkflowSummaryDto`
- `WorkflowDetailDto`
- `AlertDto`
- `CommandDto`
- `InfrastructureSummaryDto`
- `CostSummaryDto`

### Live events
- `LiveEventType`
- `LiveEventEnvelope<T>`
- `OverviewUpdatedEvent`
- `AgentUpdatedEvent`
- `TaskUpdatedEvent`
- `WorkflowUpdatedEvent`
- `AlertUpdatedEvent`
- `CommandUpdatedEvent`
- `ProviderUpdatedEvent`

### Ingestion placeholders for WP3
- `AgentHeartbeatInput`
- `TaskStateTransitionInput`
- `WorkflowStateTransitionInput`
- `StructuredLogInput`
- `EventInput`
- `CostRecordInput`
- `ProviderHealthSnapshotInput`

That gives WP3/WP4 a head start without forcing all fields to be final now.

---

## Database setup for WP1

Even though schema implementation belongs to WP2, WP1 should establish the plumbing.

### In scope now
- Drizzle config
- connection module
- migration command wiring
- seed command wiring
- empty or placeholder migration directory

### Not required yet
- full schema translation
- full seed data
- query repository implementation

### Expected command surface
At repo root:
- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:seed`
- `pnpm infra:up`
- `pnpm infra:down`
- `pnpm infra:reset`

---

## Local development baseline

## Services
Docker Compose should start:
- `postgres`
- `redis`

### Postgres defaults
- DB name: `mission_control`
- user: `mission_control`
- password: local dev only via `.env`
- host port: `5432`

### Redis defaults
- host port: `6379`

## Local app ports
Suggested defaults:
- API: `4001`
- Web: `3000`

## Environment model
Use repo-root `.env` only as a convenience for local dev, but keep per-app examples under `infra/env/`.

Suggested API env keys:
- `NODE_ENV`
- `PORT`
- `LOG_LEVEL`
- `DATABASE_URL`
- `REDIS_URL`
- `MISSION_CONTROL_AUTH_MODE=dev`
- `SSE_HEARTBEAT_MS=15000`

Suggested web env keys:
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_LIVE_URL`

## Local-first workflow
1. `pnpm install`
2. `pnpm infra:up`
3. `pnpm db:migrate`
4. `pnpm dev`
5. open API docs / health endpoints

---

## CI baseline

Minimum CI for WP1 should run on every PR:
- install dependencies
- lint
- typecheck
- run tests
- build shared package
- build API
- optionally build web shell if scaffolded

Recommended stages:
1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm test`
4. `pnpm build`

Later packages can add DB-backed integration jobs and end-to-end suites.

---

## Suggested implementation order inside WP1

### Step 1 — repo root tooling
Create:
- `package.json`
- `pnpm-workspace.yaml`
- `turbo.json`
- `tsconfig.base.json`
- `.gitignore`
- `.editorconfig`
- `.env.example`

### Step 2 — shared package
Create `packages/shared` with:
- TypeScript build config
- core enums/constants
- error/pagination schemas
- first DTO exports

### Step 3 — API app skeleton
Create `apps/api` with:
- Fastify bootstrap
- config/env loading
- `/healthz`, `/readyz`, `/api/v1/me`, `/api/v1/overview`
- SSE route scaffold at `/api/v1/live`
- basic error handler and request logging

### Step 4 — infra and local scripts
Create `infra/docker/docker-compose.yml` with Postgres + Redis and helper scripts.

### Step 5 — CI baseline
Add one workflow file for lint/test/build.

### Step 6 — readme updates
Document exactly how to boot local dev.

---

## Proposed starter conventions

### Naming
- file names: kebab-case
- exported DTO/schema/type names: PascalCase
- route files grouped by resource
- domain modules grouped by bounded area from `docs/API_V1.md`

### Error model
All API errors should conform early to:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "User does not have permission to restart agent",
    "details": {}
  }
}
```

This should be implemented in the API scaffold even before real authorization lands.

### Auth stance for WP1
Use a simple dev-mode auth stub in `apps/api` returning a fixed user for `GET /api/v1/me`.

Reason:
- unblocks API/UI integration
- keeps room for real auth in WP4/WP11
- avoids baking in premature auth architecture

### Realtime stance for WP1
Implement SSE as a working scaffold with:
- initial connection event
- keepalive heartbeat event
- typed envelope from `packages/shared`

No real fanout needed yet; just prove the transport shape.

---

## What should explicitly wait until WP2+

Do not drag these into WP1 unless there is spare capacity:
- full DB schema implementation
- ingestion endpoints
- command execution pipeline
- RBAC enforcement beyond a simple dev stub
- production deployment manifests
- full observability stack setup (Prometheus/Loki/Grafana)

Those are important, but they are not the shortest path to an implementation-ready skeleton.

---

## Definition of done for backend/platform WP1

WP1 is done when all of the following are true:

- monorepo tooling is committed and runnable
- `apps/api` starts locally
- `packages/shared` exports initial contracts
- Postgres and Redis start via Docker Compose
- health and v1 bootstrap endpoints respond
- SSE endpoint shape exists
- lint/test/build commands work in CI
- README contains local setup instructions
- no major stack ambiguity remains for WP2/WP3 teams

---

## Practical handoff into WP2 and WP3

### Enables WP2
- Drizzle config and migration folders exist
- API has DB plugin and env model ready
- local Postgres lifecycle is standardized

### Enables WP3
- shared ingestion payload package shape exists
- SSE/live event envelope exists
- Redis hook exists for future fanout/command scaffolding

### Enables WP4
- route/module/repository boundaries are in place
- shared DTOs are ready to flesh out
- error and pagination patterns are standardized

---

## Recommended first tickets after this document

1. scaffold root monorepo config with `pnpm` + `turbo`
2. scaffold `packages/shared` with status enums and core DTOs
3. scaffold `apps/api` Fastify server with health + `/api/v1/me`
4. add Drizzle config and DB connection plugin
5. add Docker Compose for Postgres + Redis
6. add CI workflow for lint/test/build
7. update README with local boot instructions

This is the smallest credible foundation that matches the current architecture and unlocks the next work packages without guesswork.
