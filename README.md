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

Næste logiske skridt er WP2: konkret schema/migrations og read-model APIs ovenpå denne foundation.
