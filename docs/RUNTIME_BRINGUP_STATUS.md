# Runtime bring-up status

_Last verified: 2026-03-29 07:58 UTC_

## Goal of this pass
Praktisk lokal readiness-check for den nye Prisma + read API-slice:
- kan migrationen anvendes?
- kan seed-data loades?
- kan API starte mod rigtige dependencies?
- kan web-shellen starte/buildes?
- hvad er den korteste vej til første lokale demo?

## Kort status
Repoet er **tæt på at være kørbart**, men **ikke runtime-komplet på denne host** fordi de nødvendige lokale services mangler:
- ingen `docker`
- ingen `docker compose`
- ingen lokal `postgres`
- ingen lokal `redis-server`
- ingen `psql`
- ingen global `pnpm` shim i `PATH` (kun `corepack pnpm` virker)

Det betyder:
- Prisma schema og client generation virker
- web-appen build’er
- API’en **kan ikke boote** fordi den forbinder eager til Postgres ved startup
- migration og seed kan **ikke** runtime-verificeres uden en rigtig Postgres-instans

## Hvad blev verificeret

### Host/runtime-prober
Kommandoer:
```bash
command -v docker
command -v podman
command -v psql
command -v postgres
command -v redis-server
command -v redis-cli
command -v pnpm
corepack pnpm --version
node --version
```

Observeret:
- `docker`: mangler
- `podman`: mangler
- `psql`: mangler
- `postgres`: mangler
- `redis-server`: mangler
- `redis-cli`: mangler
- `pnpm`: mangler
- `corepack pnpm --version`: `10.8.0`
- `node --version`: `v22.22.0`

Ekstra note:
```bash
corepack enable pnpm
```
fejler her med:
```text
EACCES: permission denied ... -> '/usr/bin/pnpm'
```
Så root-scripts som `pnpm dev` / `pnpm typecheck` kan ikke bruges direkte på denne host uden enten:
1. en brugershim til `pnpm`, eller
2. at kommandoer køres som `corepack pnpm ...`

## Prisma/read-slice status

### Schema validate
Kommando:
```bash
export DATABASE_URL='postgresql://mission_control:mission_control@localhost:5432/mission_control?schema=public'
corepack pnpm --filter @mission-control/api exec prisma validate
```

Resultat:
```text
The schema at prisma/schema.prisma is valid 🚀
```

### Prisma client generate
Kommando:
```bash
export DATABASE_URL='postgresql://mission_control:mission_control@localhost:5432/mission_control?schema=public'
corepack pnpm --filter @mission-control/api exec prisma generate
```

Resultat:
- lykkedes
- Prisma Client blev genereret

### API/shared typecheck
Kommando:
```bash
corepack pnpm --filter @mission-control/api typecheck
corepack pnpm --filter @mission-control/shared typecheck
```

Resultat:
- begge lykkedes

## Migration/apply status
Kommando:
```bash
export DATABASE_URL='postgresql://mission_control:mission_control@localhost:5432/mission_control?schema=public'
corepack pnpm --filter @mission-control/api exec prisma migrate deploy
```

Resultat:
```text
Error: P1001: Can't reach database server at `localhost:5432`
```

Konklusion:
- migrationsættet ser klar ud til apply
- men apply er **ikke verificeret** i denne session pga. manglende Postgres runtime

## Seed status
Kommando:
```bash
export DATABASE_URL='postgresql://mission_control:mission_control@localhost:5432/mission_control?schema=public'
corepack pnpm --filter @mission-control/api db:seed
```

Resultat:
- seed-scriptet starter korrekt
- første DB-kald fejler med manglende databaseforbindelse

Fejl:
```text
PrismaClientInitializationError:
Can't reach database server at `localhost:5432`
```

Konklusion:
- seed-scriptet er wired korrekt nok til at forsøge DB-arbejde
- men **seed er ikke runtime-verificeret** uden Postgres

## API startup status
Kommando:
```bash
export DATABASE_URL='postgresql://mission_control:mission_control@localhost:5432/mission_control?schema=public'
export REDIS_URL='redis://localhost:6379'
export API_PORT=4001
export LOG_LEVEL=debug
corepack pnpm --filter @mission-control/api dev
```

Resultat:
API’en stopper under plugin-init med:
```text
PrismaClientInitializationError: Can't reach database server at `localhost:5432`
errorCode: 'P1001'
```

Vigtig detalje:
- `apps/api/src/plugins/prisma.ts` kalder `await prisma.$connect()` ved startup
- `apps/api/src/plugins/redis.ts` kalder `await redis.connect()` ved startup

Det er fint for readiness, men betyder at API-boot er **hard-blocked** på både Postgres og Redis.
I denne session nås Redis-fejlen ikke, fordi Postgres fejler først.

## Web startup/build status
Kommando:
```bash
corepack pnpm --filter @mission-control/web build
```

Resultat:
- build lykkedes
- Next producerede routes for overview/agents/tasks/workflows/etc.

Vigtig produktmæssig observation:
- web-shellen er stadig primært scaffold/static
- den nye DB-backed read API er endnu ikke koblet ind i web-siderne
- derfor er web-build **ikke** bevis på fuld end-to-end MVP, kun at shellen kan bygges lokalt

## Faktiske blockers
1. **Ingen Postgres runtime på hosten**
   - blokerer `prisma migrate ...`, `db:seed`, API-start og `/readyz`
2. **Ingen Redis runtime på hosten**
   - blokerer API-start og `/readyz`, selv hvis Postgres bliver tilgængelig
3. **Ingen Docker/Compose på hosten**
   - repoets dokumenterede golden path (`pnpm infra:up`) kan ikke bruges her
4. **Ingen global `pnpm` shim**
   - root Turbo-kommandoer fejler på denne host
   - workaround er `corepack pnpm ...` for package-scoped commands
5. **Web er endnu ikke wired til de nye read endpoints**
   - første rigtige demo kræver stadig frontend wiring, selv når infra er oppe

## Fastest path to first working local demo

### Option A — hurtigste normale vej (anbefalet)
Kør repoet på en maskine med Docker + Compose + pnpm i PATH, og brug:
```bash
cp .env.example .env
corepack pnpm install
corepack pnpm --filter @mission-control/api exec prisma generate
bash infra/scripts/infra-up.sh
corepack pnpm --filter @mission-control/api exec prisma migrate deploy
corepack pnpm --filter @mission-control/api db:seed
corepack pnpm --filter @mission-control/api dev
corepack pnpm --filter @mission-control/web dev
```

Verificér derefter:
```bash
curl http://localhost:4001/healthz
curl http://localhost:4001/readyz
curl http://localhost:4001/api/v1/overview
curl http://localhost:4001/api/v1/agents
curl http://localhost:4001/api/v1/tasks
curl http://localhost:4001/api/v1/workflows
```

Forventet resultat:
- API svarer med seeded overview/list/detail data
- web shell kan åbnes på `http://localhost:3000`
- men visuel værdi er stadig begrænset indtil web-siderne fetcher de nye endpoints

### Option B — korteste vej på denne host-type
Hvis Docker ikke kan installeres, skal følgende være tilgængeligt manuelt:
- en Postgres 16-instans på `localhost:5432`
- en Redis-instans på `localhost:6379`
- en brugbar `pnpm`-shim eller fortsat brug af `corepack pnpm`

Derefter:
```bash
cp .env.example .env
corepack pnpm install
corepack pnpm --filter @mission-control/api exec prisma generate
corepack pnpm --filter @mission-control/api exec prisma migrate deploy
corepack pnpm --filter @mission-control/api db:seed
corepack pnpm --filter @mission-control/api dev
corepack pnpm --filter @mission-control/web dev
```

## Næste tekniske skridt efter infra er oppe
1. Runtime-verificér migration apply mod rigtig Postgres
2. Runtime-verificér `db:seed`
3. Start API og bekræft `/healthz`, `/readyz`, samt overview/agents/tasks/workflows endpoints
4. Wire `apps/web` overview/list/detail pages til disse endpoints
5. Gentag bring-up og dokumentér den første fulde demo-path

## Bottom line
Backend read-slicen ser **kodeklar** ud og web-shellen **build’er**, men repoet er endnu **ikke lokalt demo-klar på denne host**. Den reelle blocker er miljø/runtime, ikke TypeScript eller Prisma-schemaet.
