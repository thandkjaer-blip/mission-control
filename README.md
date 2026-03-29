# mission-control

Mission Control er nu scaffoldet som WP1-monorepo efter den låste retning i `decisions/0003-wp1-execution-direction.md`.

## Struktur
- `apps/web` — Next.js 15 operator shell scaffold
- `apps/api` — Fastify API scaffold med health, readiness, `me`, `overview` og WebSocket live-stub
- `packages/shared` — delte typer, DTO’er og live event envelopes
- `infra/docker` — lokal Postgres + Redis via Docker Compose
- `decisions/`, `docs/`, `tasks/` — fortsat source of truth for retning og arbejde

## Golden path
1. `corepack pnpm install`
2. `cp .env.example .env`
3. `bash infra/scripts/local-doctor.sh`
4. `bash infra/scripts/infra-up.sh`
5. `corepack pnpm db:generate`
6. `corepack pnpm db:migrate`
7. `corepack pnpm dev`

## Standardkommandoer
- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm typecheck`
- `pnpm infra:up`
- `pnpm infra:down`
- `pnpm infra:reset`
- `pnpm local:doctor`
- `pnpm local:restart-api`
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:seed`
- `bash infra/scripts/runtime-refresh.sh`
- `pnpm runtime:refresh`

## WP1 leveret her
- root workspace config (`pnpm`, `turbo`, shared TS config)
- web shell scaffold med hovedruter
- API scaffold med health + live transport stub
- delt kontraktpakke
- Prisma + Redis wiring baseline
- Docker Compose baseline
- CI workflow baseline

## OpenClaw runtime refresh (normal vej til real data)
- Kør `bash infra/scripts/runtime-refresh.sh` for at projektere rigtige OpenClaw-sessioner ind i Mission Control
- Eller brug Mission Control API/UI via `GET /api/v1/runtime-source` og `POST /api/v1/runtime-source/refresh`
- Scriptet loader `.env`, bruger OpenClaw standard-index som default og kører via `corepack pnpm`
- Overview viser nu runtime-source status, sidste refresh-resultat og en refresh-knap, når API’et er oppe
- Se `docs/RUNTIME_REFRESH_RUNBOOK.md` for overrides og forventet output

## WP2 data backbone (første rigtige slice)
- `apps/api/prisma/schema.prisma` er nu udvidet fra placeholder-modellen til en MVP-schemaflade for:
  - users
  - agents
  - workflows
  - tasks + workflow task dependencies
  - events + structured logs + agent metric snapshots
  - cost records + provider health snapshots
  - alerts + control commands
  - audit logs + API key inventory
- Canonical initial migration ligger i `apps/api/prisma/migrations/20260329080000_initial_read_api/`
- Follow-up enum-fix for runtime-ingestion ligger i `apps/api/prisma/migrations/20260329111500_add_runtime_agent_type/`
- Seed-data i `apps/api/prisma/seed.ts` opretter et deterministisk demo-miljø med:
  - 4 brugere
  - 5 agenter
  - 3 workflows
  - 10 tasks med dependencies, blocked/running/failed states
  - repræsentative alerts, commands, events, logs, metrics, costs og provider-health snapshots

### Bevidst udskudt fra denne schema-pass
- dybere read-model queries og API-endpoints
- ingestion write-paths og status-reconciliation
- trigger/view/materialized-read-model arbejde
- mere avanceret RBAC og auth-binding til `users`

Næste logiske skridt er at koble overview/agents/tasks/workflows-API’erne til denne persistence-layer.
