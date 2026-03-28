# 0003 - WP1 execution direction

## Status
Accepted

## Purpose
Lock one authoritative WP1 implementation direction for Mission Control by reconciling the current planning artifacts:
- `decisions/0002-mvp-stack-decision.md`
- `docs/WP1_FOUNDATION.md`
- `docs/FRONTEND_SHELL_PLAN.md`
- `docs/WORK_PACKAGES.md`

This document resolves the remaining WP1 tensions and is now the **single source of truth for WP1 execution** until replaced by a later decision record.

---

## Decision summary
WP1 will be executed as a **single TypeScript monorepo** with:
- **`pnpm` workspaces** at the repo root
- **Turborepo** for task orchestration
- **`apps/web` = Next.js 15 + React + TypeScript**
- **`apps/api` = Fastify + TypeScript**
- **`packages/shared` = shared DTOs, zod schemas, live event types, enums, and API contract primitives**
- **PostgreSQL** as the only source of truth
- **Prisma** for schema, migrations, and most application data access
- **raw SQL alongside Prisma** for heavy read models, aggregates, and time-oriented queries
- **Redis** for local dev pub/sub, command fanout scaffolding, and ephemeral coordination
- **Docker Compose** as the local dependency baseline for Postgres + Redis
- **REST-first reads/writes plus WebSocket as the primary live transport**

WP1 includes **both** backend/platform scaffolding and the **web shell scaffold**, but not full feature implementation.

---

## Resolved tensions

### 1) Prisma vs Drizzle
**Decision: Prisma wins for MVP foundation.**

`docs/WP1_FOUNDATION.md` proposed Drizzle, but `decisions/0002-mvp-stack-decision.md` already accepted Prisma as the MVP default. WP1 therefore standardizes on:
- **Prisma schema + migrations as the authoritative implementation path for `docs/DB_SCHEMA_V1.md`**
- **Prisma Client for most CRUD and normal read-model work**
- **explicit raw SQL for complex aggregations, list queries, rollups, and observability/cost workloads where Prisma would become awkward**

This preserves fast onboarding and a cleaner migration story while still allowing SQL where it is the right tool.

**Practical rule:** Prisma is the default, not a prison.

---

### 2) WebSocket vs SSE-first
**Decision: WebSocket is the primary MVP live transport.**

`docs/WP1_FOUNDATION.md` leaned SSE-first for simplicity, but `decisions/0002-mvp-stack-decision.md` accepted WebSocket as the product-direction fit. WP1 therefore locks:
- **`/api/v1/live` is designed around a WebSocket transport from the start**
- REST remains authoritative for initial page loads, list/detail reads, and command creation
- the frontend shell remains **read-first**, then layers live updates on top
- reconnect, auth, and subscription handling are treated as first-class design concerns early

This aligns with `docs/FRONTEND_SHELL_PLAN.md`, which already assumes a live operator shell with connection state, stale handling, command status updates, and cross-surface entity refreshes.

**Implementation stance for WP1:** ship a thin but real WebSocket scaffold, not a fake placeholder that later has to be replaced wholesale.

---

### 3) Repo/tooling layout
**Decision: keep the monorepo shape from `0002`, enrich it with the useful scaffolding guidance from `docs/WP1_FOUNDATION.md`, and explicitly include the frontend shell skeleton now.**

Authoritative layout baseline:

```text
mission-control/
├─ apps/
│  ├─ api/        # Fastify API + live gateway
│  └─ web/        # Next.js operator shell
├─ packages/
│  └─ shared/     # DTOs, zod schemas, event types, enums, shared contracts
├─ infra/
│  ├─ docker/     # compose + local infra support
│  ├─ env/        # example env files
│  ├─ scripts/    # local helper scripts
│  └─ ci/         # CI references/templates if needed
├─ docs/
├─ decisions/
└─ tasks/
```

Repo/tooling choices locked for WP1:
- root workspace management: **pnpm**
- orchestration: **turbo**
- unit/integration testing baseline: **Vitest**
- lint/format baseline: **ESLint + Prettier**
- TypeScript dev execution where useful: **tsx**
- shared TS config at repo root

---

### 4) Scope of WP1: backend-only foundation vs full implementation shell
**Decision: WP1 scaffolds both backend and frontend shell foundations, but stops before deep feature work.**

`docs/WORK_PACKAGES.md` defines WP1 as platform foundation and repo scaffolding. `docs/FRONTEND_SHELL_PLAN.md` makes clear that several frontend decisions must be made in WP1 to avoid later thrash. Those are now included.

WP1 therefore covers:
- repo root tooling and workspace config
- API bootstrap
- web bootstrap
- shared contracts package bootstrap
- Postgres/Redis local infra bootstrap
- env model and example files
- baseline health/readiness endpoints
- a dev auth stub for `GET /api/v1/me`
- route skeletons / page skeletons for the operator shell
- live client/server scaffolding for WebSocket
- CI baseline: lint, typecheck, test, build
- README/local boot instructions

WP1 does **not** include:
- full schema implementation
- ingestion pipeline
- complete read-model API
- command execution flows
- full entity UI wiring
- production deployment manifests

---

## Authoritative WP1 architecture

### Frontend (`apps/web`)
Use **Next.js 15 App Router**.

WP1 frontend responsibilities:
- app shell layout
- route skeletons for:
  - `/overview`
  - `/agents`
  - `/agents/[agentId]`
  - `/tasks`
  - `/tasks/[taskId]`
  - `/workflows`
  - `/workflows/[workflowId]`
  - `/alerts`
  - `/commands`
- top bar with environment/user/live-status placeholders
- left navigation matching the operator IA
- shared UI primitives baseline:
  - status badge
  - metric card
  - filter bar
  - empty/error/loading/stale states
  - page header
  - tabs/dialog scaffolding
- REST data layer baseline
- WebSocket client abstraction with reconnect + stale-state handling scaffold
- role-aware rendering helpers based on `GET /api/v1/me`

The frontend remains aligned to the read-first model in `docs/FRONTEND_SHELL_PLAN.md`: page loads come from REST, live transport patches or invalidates.

### Backend (`apps/api`)
Use **Fastify**.

WP1 backend responsibilities:
- Fastify app/server bootstrap
- typed env loading
- logger setup
- Prisma wiring
- Redis wiring
- health endpoints:
  - `GET /healthz`
  - `GET /readyz`
- dev auth stub:
  - `GET /api/v1/me`
- placeholder read endpoint:
  - `GET /api/v1/overview`
- WebSocket live endpoint scaffold:
  - `/api/v1/live`
- consistent API error envelope baseline
- route/module/plugin structure that can absorb WP2-WP7 cleanly

### Shared contracts (`packages/shared`)
Create the package early and keep it narrow.

Initial exports should include:
- common enums/statuses/roles
- API error shape
- pagination primitives
- `MeDto`
- `OverviewDto`
- list/detail DTO skeletons for agents/tasks/workflows/alerts/commands
- `LiveEventType`
- `LiveEventEnvelope`
- MVP live event type skeletons
- ingestion payload placeholders that WP3 will flesh out

Rule:
- cross-app contract types live here
- Prisma schema and DB-specific persistence details stay in `apps/api`
- UI-only view helpers stay in `apps/web`

---

## Local development baseline
WP1 standard local setup:
- **Docker Compose** starts:
  - PostgreSQL
  - Redis
- API and web run on host during normal development
- repo scripts provide the golden path for booting/stopping/resetting local infra

Suggested commands to wire in WP1:
- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm typecheck`
- `pnpm db:migrate`
- `pnpm db:seed`
- `pnpm infra:up`
- `pnpm infra:down`
- `pnpm infra:reset`

---

## WP1 deliverables
WP1 is done when all of the following are true:

1. **Monorepo scaffold exists and installs cleanly**
   - root `package.json`
   - `pnpm-workspace.yaml`
   - `turbo.json`
   - root TS config
   - lint/format/test baseline

2. **`apps/api` boots locally**
   - health/readiness endpoints respond
   - dev auth stub responds
   - placeholder overview route responds
   - WebSocket live endpoint scaffold exists

3. **`apps/web` boots locally**
   - app shell renders
   - primary routes exist as placeholders
   - live status indicator scaffold exists
   - role/session bootstrap path exists

4. **`packages/shared` builds and is consumed by both apps**

5. **Postgres + Redis run via Docker Compose**

6. **Prisma foundation is wired**
   - schema location established
   - migration commands wired
   - DB connection path proven

7. **CI runs the baseline checks**
   - lint
   - typecheck
   - test
   - build

8. **README documents the golden-path local setup**

9. **No material ambiguity remains for WP2/WP3/WP6 teams**

---

## Execution order inside WP1
1. Root workspace/tooling/bootstrap
2. `packages/shared` contract baseline
3. `apps/api` bootstrap with Prisma + Redis + health + `me` + `overview` + WebSocket scaffold
4. `apps/web` shell bootstrap with route skeletons and live client scaffold
5. `infra/docker` Compose and helper scripts
6. CI wiring
7. README and developer setup notes

This order keeps the shared contract surface available early and prevents backend-only scaffolding from forcing later frontend rewrites.

---

## Consequences
- `docs/WP1_FOUNDATION.md` remains useful as historical planning input, but its **Drizzle** and **SSE-first** recommendations are superseded by this decision.
- `docs/FRONTEND_SHELL_PLAN.md` remains directionally valid and should drive shell IA and operator UX priorities, but its transport assumptions must be read as **WebSocket-backed live updates**.
- `docs/WORK_PACKAGES.md` remains the delivery sequence baseline, with WP1 now concretized by this decision.
- All new WP1 implementation tickets should reference this document.

---

## Superseded guidance
For WP1 execution specifically, this decision supersedes conflicting guidance in:
- `docs/WP1_FOUNDATION.md` on **Drizzle**
- `docs/WP1_FOUNDATION.md` on **SSE-first**

It also clarifies an ambiguity in `docs/WORK_PACKAGES.md` by explicitly including the **web shell scaffold** in WP1.

---

## Final directive
If a contributor finds conflicting WP1 guidance elsewhere in the repo, follow **this document** and `decisions/0002-mvp-stack-decision.md`.

WP1 direction is now locked.