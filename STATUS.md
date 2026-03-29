# STATUS

## Projektstatus
Projektet har forladt den rene WP1-scaffoldfase. Fundamentet er på plads, og næste realistiske mål er nu en første eksekverbar MVP-slice ovenpå den eksisterende monorepo.

### Fundet eksisterende materiale
- Arkitekturudkast
- API v1-spec
- DB schema v1
- MVP backlog
- Frontend shell-plan
- WP1-beslutninger og scaffold-implementering

### Hvad er gjort
- Projektmappe oprettet
- Dokumenter samlet ind i repo-strukturen
- Første status- og styringsfiler oprettet
- Konkret work-package plan for MVP oprettet i `docs/WORK_PACKAGES.md`
- Første konkrete WP1-WP3 taskfiler oprettet i `tasks/todo/`
- MVP stack-beslutning og endelig WP1-eksekveringsretning låst i `decisions/0002-mvp-stack-decision.md` og `decisions/0003-wp1-execution-direction.md`
- WP1 scaffold implementeret som pnpm/turbo monorepo med `apps/api`, `apps/web`, `packages/shared` og `infra/`
- Ny konkret 1–2 dages implementeringsplan udarbejdet i `docs/IMPLEMENTATION_PLAN_NEXT.md`
- Frontend shell-planen er oversat til konkrete implementeringsnoter i `docs/FRONTEND_IMPLEMENTATION_NEXT.md`, inkl. route map, shared UI-primitives, read/live data-strategi og anbefalet build-rækkefølge
- Backend/platform scaffold-anbefaling udarbejdet i `docs/BACKEND_SCAFFOLD_RECOMMENDATION.md` for `apps/api`, `database/migrations`, `packages/shared` og live transport
- Første DB-backed read-slice er nu implementeret i `apps/api` for:
  - `GET /api/v1/overview`
  - `GET /api/v1/agents`
  - `GET /api/v1/agents/:agentId`
  - `GET /api/v1/tasks`
  - `GET /api/v1/tasks/:taskId`
  - `GET /api/v1/workflows`
  - `GET /api/v1/workflows/:workflowId`
- Prisma schema er udvidet fra placeholder til Mission Control MVP-kernen + overview-afhængigheder, og der er genereret en initial SQL migration under `apps/api/prisma/migrations/20260329080000_initial_read_api/`
- Seed-scriptet er omskrevet til deterministisk demo-data for users, agents, workflows, tasks, dependencies, alerts, commands, events, logs, metrics, provider health og costs
- `packages/shared` er udvidet med første rigtige DTOs/filterkontrakter for agents/tasks/workflows/overview
- Første rigtige Prisma data-backbone implementeret i `apps/api/prisma/schema.prisma` med MVP-tabeller for overview/agents/tasks/workflows plus nødvendige supporttabeller til realistiske reads
- Første migrationsæt genereret i `apps/api/prisma/migrations/20260329080000_mvp_data_backbone/`
- Deterministisk demo-seed tilføjet i `apps/api/prisma/seed.ts` med brugere, agenter, workflows, tasks, dependencies, alerts, commands, events, logs, metrics, costs og provider-health snapshots

### Hvad mangler
- Migrationen og seed-scriptet er endnu ikke runtime-verificeret mod lokal Postgres i denne session, fordi værtsmiljøet mangler Docker/`docker compose`, Postgres og Redis
- API’en kan derfor ikke starte end-to-end lokalt her; `PrismaClientInitializationError (P1001)` rammes ved boot mod `localhost:5432`
- Root `pnpm`/turbo-flowet er også delvist host-blokeret her, fordi kun `corepack pnpm` findes, mens en global `pnpm` shim i `PATH` mangler
- Web shell er nu koblet til overview/agents/tasks/workflows read APIs for hovedflowet, men mangler stadig live invalidation, shell-level `GET /api/v1/me`, richer filter controls og mere raffinerede loading/empty states
- Detailundersiderne viser nu reelle summary/datafelter, men events/logs/metrics/cost/history/graph-subviews er stadig kun markerede gaps indtil de tilsvarende endpoints findes
- WP3 ingestion-kontrakter og første write-paths mangler
- Alerts/commands/observability-siderne mangler stadig deres første rigtige read-models

### Næste skridt
1. Bring lokal infra op (Docker Compose eller manuel Postgres+Redis) og følg `docs/RUNTIME_BRINGUP_STATUS.md`
2. Verificér `prisma migrate` + `db:seed` mod rigtig Postgres, og boot derefter API + `/readyz`
3. Tilføj integrationstests omkring overview/agents/tasks/workflows-slicen samt web-fetch fejltilfælde
4. Wire shell-level `GET /api/v1/me` + freshness/live status i topbaren
5. Udvid read-siden videre til alerts/commands/observability samt detail-subresources (events/logs/metrics/costs/graph)
6. Start derefter den mindste nyttige WP3-ingestion-slice (heartbeats/state transitions/events)
