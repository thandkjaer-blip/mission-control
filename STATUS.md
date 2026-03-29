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

### Hvad mangler
- Prisma schema er stadig kun en placeholder og mangler fuld oversættelse af `docs/DB_SCHEMA_V1.md`
- Seed/demo-data mangler for de centrale entiteter
- API read models for overview/agents/tasks/workflows er stadig stubs
- Web shell er stadig placeholder-baseret og ikke koblet til rigtige API reads
- WP3 ingestion-kontrakter og første write-paths mangler

### Næste skridt
1. Implementér WP2 rigtigt: oversæt DB schema v1 til Prisma models, migrationer og seed-data
2. Udvid `packages/shared` til reelle DTOs/filterkontrakter for overview/agents/tasks/workflows/alerts/commands
3. Erstat stub-API’er med DB-backed read models for overview, agents, tasks og workflows
4. Brug `docs/FRONTEND_IMPLEMENTATION_NEXT.md` som build-order for at gøre web shell til en rigtig MVP-operatørflade
5. Kobl web shell til disse reads og gør Overview -> list -> detail klikbart på rigtige data
6. Start derefter den mindste nyttige WP3-ingestion-slice (heartbeats/state transitions/events)
