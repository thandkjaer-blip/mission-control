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
- Første rigtige Prisma data-backbone implementeret i `apps/api/prisma/schema.prisma` med MVP-tabeller for overview/agents/tasks/workflows plus nødvendige supporttabeller til realistiske reads
- Første migrationsæt genereret i `apps/api/prisma/migrations/20260329080000_mvp_data_backbone/`
- Deterministisk demo-seed tilføjet i `apps/api/prisma/seed.ts` med brugere, agenter, workflows, tasks, dependencies, alerts, commands, events, logs, metrics, costs og provider-health snapshots

### Hvad mangler
- API read models for overview/agents/tasks/workflows er stadig stubs og bruger endnu ikke den nye persistence-layer
- Web shell er nu ryddet lidt op på shell-/route-niveau, men er stadig kun delvist placeholder-baseret og endnu ikke koblet til rigtige API reads
- WP3 ingestion-kontrakter og første write-paths mangler
- Migrationen er genereret og committed, men ikke runtime-verificeret mod lokal Postgres i denne session fordi Docker ikke var tilgængelig i miljøet

### Næste skridt
1. Kobl `apps/api` overview/agents/tasks/workflows-ruter til Prisma-baserede queries ovenpå den nye schemaflade
2. Udvid `packages/shared` til reelle DTOs/filterkontrakter for overview/agents/tasks/workflows/alerts/commands
3. Gør web shell data-backed: Overview -> list -> detail på rigtige API-reads
4. Verificér migration + seed mod lokal Postgres så snart Docker/Postgres er tilgængelig igen
5. Start derefter den mindste nyttige WP3-ingestion-slice (heartbeats/state transitions/events)
