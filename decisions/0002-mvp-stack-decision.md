# 0002 - MVP stack decision

## Status
Accepted

## Context
Mission Control har arkitektur-, API-, schema- og backlogmateriale, men WP1 kan ikke starte sikkert uden et låst valg af MVP-stack.

MVP’en skal understøtte:
- read-heavy operatør-UI med live status
- command pipeline med audit og async resultater
- PostgreSQL som source of truth
- hurtig iteration i ét repo med delt TypeScript-kontraktlag
- et lokalt dev setup som er simpelt nok til at hele teamet faktisk bruger det

De vigtigste åbne valg var:
- frontend: Next.js/React vs lettere SPA-setup
- backend: Fastify vs NestJS
- DB access: ORM/query strategy
- realtime: WebSocket vs SSE
- local dev: Docker Compose vs mere manuelle setups

## Decision
Mission Control MVP bygges som en TypeScript monorepo med følgende konkrete stack:

### Frontend
- **Next.js 15 + React + TypeScript**
- App Router bruges til web shell, navigation og server-renderet initial data, hvor det giver mening.
- UI implementeres som en intern operations-webapp, ikke marketing-site eller public SaaS frontend.

### Backend
- **Fastify + TypeScript**
- Backend startes som én modulær API-applikation i `apps/api`, ikke som et sæt mikroservices.
- OpenAPI-generering og schema-first validation holdes tæt på request/response-kontrakterne.

### Database access
- **Prisma til schema, migrations og hovedparten af CRUD/read models**
- **Suppleret med rå SQL via Prisma/query helper for tunge aggregater, tidsserier og specialqueries**
- PostgreSQL forbliver eneste autoritative database i MVP.

### Realtime transport
- **WebSocket som primær live transport for MVP**
- REST bruges fortsat til read models og command-initiering.
- WebSocket bruges til `agent.updated`, `task.updated`, `workflow.updated`, `alert.*`, `command.updated`, `provider.updated` og `overview.updated`.

### Local dev setup
- **Docker Compose** til lokale afhængigheder
- Compose skal mindst starte:
  - PostgreSQL
  - Redis
- API og web kan køre på hosten i dev for hurtig feedback, men skal også kunne startes samlet via repo-scripts.

### Repo/layout baseline
- `apps/web` — Next.js UI
- `apps/api` — Fastify API og realtime gateway
- `packages/shared` — DTO’er, event-typer, enums, zod/schema-kontrakter
- `infra/docker` eller `infra/compose` — lokal udviklingsinfrastruktur

## Rationale

### Hvorfor Next.js
Next.js er det rigtige MVP-valg, fordi produktet er et komplekst operatørinterface med mange liste-/detaljevisninger, filtrering og entity-drilldown. Vi får:
- moden React-platform med lav beslutningsfriktion
- god TypeScript-understøttelse
- stærk routing/layout-model til overview, agents, tasks, workflows, alerts osv.
- mulighed for SSR/RSC på read-heavy sider uden at gøre klienten sværere senere
- let vej til auth/session-håndtering når governance/RBAC lander

Et lettere Vite-SPA-setup ville være marginalt enklere i starten, men forskellen er for lille til at opveje den struktur og konvention, Next.js giver et ops-dashboard med mange surfaces.

### Hvorfor Fastify frem for NestJS
Fastify passer bedre til MVP’en end NestJS, fordi vi har brug for fart, få abstraktionslag og direkte kontrol over request lifecycle, validation og realtime integration. Vi får:
- mindre framework-tyngde
- høj ydeevne og lav overhead
- nemmere integration af REST + WebSocket i én service
- mere direkte mapping fra vores nuværende docs til implementering

NestJS er et legitimt valg, især hvis teamet vil have tung DI/enterprise-struktur, men til denne MVP vil det sandsynligvis skabe mere ceremoniel kode end reel fart.

### Hvorfor Prisma + rå SQL
Prisma er den bedste MVP-balance mellem udviklingshastighed og database-disciplin:
- migrationsspor bliver konkret hurtigt
- type-safe adgang til kernetabeller
- nem onboarding for fremtidige contributors
- godt match til PostgreSQL-first designet

Men Mission Control har også aggregater, tidsbaserede queries, filtrerbare lister og korrelationsopslag, hvor rå SQL vil være mere præcist og ofte enklere end at tvinge alt gennem ORM-laget. Derfor låses strategien som **Prisma where it helps, SQL where it matters**.

### Hvorfor WebSocket frem for SSE
Arkitekturdokumenterne peger på “WebSocket eller SSE”, men til Mission Control er WebSocket det bedre primærvalg:
- flere live surfaces skal opdateres samtidigt
- commands får statusflow (`pending` → `executing` → `succeeded/failed`) som passer godt til tovejskanal, selv hvis MVP primært pusher fra serveren
- én ens transport er enklere end at starte med SSE og senere opgradere til WebSocket, når interaktiviteten stiger
- reconnect og subscriptions kan standardiseres tidligt

SSE er enklere og ville være acceptabelt til ren server-push, men MVP’en er et kontrolcenter, ikke bare en read-only monitor. WebSocket matcher produktets retning bedre.

### Hvorfor Redis i local dev
Redis vælges som MVP-bus/cache-hjælp i stedet for NATS:
- mindre ops-friktion i lokalt setup
- godt nok til command dispatch, pub/sub og kortlivede koordineringsbehov i MVP
- nem at køre i Docker Compose
- lavere kompleksitet end at introducere både Postgres og NATS før produktet har bevist sine behov

Hvis workloads senere kræver stærkere event-streaming-semantik, kan bus-laget udskiftes eller abstraheres. Det er ikke et godt MVP-sted at starte med NATS kun for principiel renhed.

## Alternatives considered

### Frontend: Vite + React SPA
**Fordele**
- enklere bootstrap
- meget let runtime-model

**Ulemper**
- mindre struktur til større app-shell
- mere manuelt arbejde omkring routing/data-loading-konventioner
- mindre oplagt hvis vi hurtigt vil have auth, layouts og delvist server-renderede flader

**Afgørelse**
Fravalgt til MVP. Godt alternativ til en mindre intern tool, men Mission Control ligner allerede mere et rigtigt produkt.

### Backend: NestJS
**Fordele**
- stærk modulstruktur
- velkendt enterprise-mønster
- indbygget arkitektur til større teams

**Ulemper**
- mere boilerplate og framework-ceremoni
- større risiko for at teamet bygger struktur før adfærd
- mindre direkte end Fastify til et hurtigt første kontrolplan

**Afgørelse**
Fravalgt til MVP, men ikke som permanent nej. Kan genovervejes hvis backend senere deles i flere services eller får markant større team.

### DB access: Drizzle eller kun SQL
**Fordele**
- tættere på SQL
- muligvis bedre til komplekse queries

**Ulemper**
- mindre samlet migrations/onboarding-fordel end Prisma for dette team og denne fase
- kun SQL fra dag 1 øger kognitiv load og gør simple flows langsommere at bygge

**Afgørelse**
Fravalgt som primær strategi. Vi vil have hurtig leverance uden at opgive SQL der, hvor det reelt er bedst.

### Realtime: SSE
**Fordele**
- simpelt server-push
- nemt at debugge
- godt til read-only dashboards

**Ulemper**
- mindre fleksibelt til fremtidig interaktivitet
- dårligere langsigtet match til command/status-strømme og subscription-behov

**Afgørelse**
Fravalgt som primær transport. Kan stadig bruges til simple interne streams eller fallback hvis nødvendigt.

### Local dev: host-only setup uden Compose
**Fordele**
- færre containere
- hurtig opstart for folk med lokal Postgres/Redis

**Ulemper**
- mere drift på hver udviklermaskine
- sværere onboarding og reproducerbarhed
- større risiko for “works on my machine”

**Afgørelse**
Fravalgt. Compose er den rigtige standardvej; host-kørsel kan være den hurtige optimerede variant ovenpå.

## Consequences
- WP1 kan nu scaffoldes uden strategiske åbne spørgsmål.
- Hele MVP’en standardiseres på TypeScript på tværs af web, API og shared contracts.
- `packages/shared` bliver et centralt artefakt og skal holdes rent for app-specifik støj.
- Prisma-schema og migrations bliver den autoritative implementering af `docs/DB_SCHEMA_V1.md`.
- API’et designes omkring REST til reads/writes og WebSocket til live updates.
- Local dev skal dokumenteres med Compose som golden path.
- Redis introduceres tidligt, så command pipeline og live fanout ikke bygges på ad hoc in-process hacks.

## Tradeoffs and risks
- Next.js tilfører mere framework end en ren SPA, men det er acceptabelt for bedre struktur.
- Fastify kræver mere bevidst arkitekturdisciplin end NestJS; teamet skal selv holde modulgrænserne rene.
- Prisma kan blive akavet til visse observability-queries; derfor skal rå SQL være en eksplicit tilladt del af designet og ikke behandles som et nederlag.
- WebSocket er mere kompleks end SSE; der skal planlægges reconnect, auth og backfill ordentligt i WP5.
- Redis er et pragmatisk MVP-valg, ikke nødvendigvis end-state event backbone.

## Explicit recommendation for WP1 execution
WP1 bør scaffoldes som:
- pnpm workspace monorepo
- `apps/web` med Next.js
- `apps/api` med Fastify
- `packages/shared` med fælles typer/schemas
- Prisma setup mod PostgreSQL
- Redis-forbindelse som del af backend foundation
- Docker Compose til Postgres + Redis
- baseline CI for lint, typecheck, test og build

Det er den anbefalede og nu låste MVP-retning, indtil et senere beslutningsdokument ændrer den.
