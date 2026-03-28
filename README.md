# mission-control

Nyt Mission Control Center for OpenClaw.

## Formål
Bygge et production-minded kontrolcenter til styring af agenter, tasks, workflows, observability, costs, governance og command execution.

## Projektprincipper
- Repo og filer er source of truth
- Vigtige beslutninger skrives ned
- Subagenter afleverer arbejde i filer
- MVP før overengineeret automation

## Struktur
- `docs/` — arkitektur, API, schema, vision, scope
- `backlog/` — MVP backlog og prioritering
- `decisions/` — beslutningslog
- `tasks/` — todo/doing/done for konkrete work packages
- `apps/` — web + API apps
- `packages/` — delte kontrakter og typer
- `infra/` — env, compose og scripts

## Første mål
1. Konsolidere eksisterende projektmateriale
2. Fastlægge MVP scope
3. Etablere implementeringsplan
4. Begynde første kodebase for backend + UI shell

## WP1 scaffold status
Der er nu et første monorepo-skelet med:
- `apps/api` som Fastify-baseret API bootstrap
- `packages/shared` til fælles DTO'er og live-kontrakter
- root workspace-filer for `pnpm` + `turbo`
- `infra/env/api.env.example` til lokal API-konfiguration

Næste naturlige skridt er installation af dependencies, Prisma/Redis-wiring, Docker Compose og web shell scaffold.
