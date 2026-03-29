# mission-control

Mission Control er nu scaffoldet som WP1-monorepo efter den låste retning i `decisions/0003-wp1-execution-direction.md`.

## Struktur
- `apps/web` — Next.js 15 operator shell scaffold
- `apps/api` — Fastify API scaffold med health, readiness, `me`, `overview` og WebSocket live-stub
- `packages/shared` — delte typer, DTO’er og live event envelopes
- `infra/docker` — lokal Postgres + Redis via Docker Compose
- `decisions/`, `docs/`, `tasks/` — fortsat source of truth for retning og arbejde

## Golden path
1. `pnpm install`
2. `pnpm infra:up`
3. `cp .env.example .env`
4. `pnpm db:generate`
5. `pnpm db:migrate`
6. `pnpm dev`

## Standardkommandoer
- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm typecheck`
- `pnpm infra:up`
- `pnpm infra:down`
- `pnpm infra:reset`
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:seed`

## WP1 leveret her
- root workspace config (`pnpm`, `turbo`, shared TS config)
- web shell scaffold med hovedruter
- API scaffold med health + live transport stub
- delt kontraktpakke
- Prisma + Redis wiring baseline
- Docker Compose baseline
- CI workflow baseline

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
- Første migration ligger i `apps/api/prisma/migrations/20260329080000_mvp_data_backbone/`
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
