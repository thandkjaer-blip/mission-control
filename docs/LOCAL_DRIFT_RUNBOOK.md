# Local drift / restart runbook

Lavrisiko bring-up og restart for den lokale Mission Control-instans.

## 1. Hurtig status

Fra repo-roden:

```bash
bash infra/scripts/local-doctor.sh
```

Den checker:
- om `node`, `corepack`, `docker`/`docker-compose` findes
- om `.env` findes
- om OpenClaw session-index findes
- om Postgres/Redis/API/Web svarer på deres forventede porte
- om Prisma-schemaet kan valideres

## 2. Bring infra op

```bash
bash infra/scripts/infra-up.sh
```

Forbedret adfærd i scriptet:
- finder både `docker compose` og `docker-compose`
- venter aktivt på at Postgres og Redis kan nås
- fejler tidligt hvis compose mangler

## 3. Forbered API efter ændringer

```bash
bash infra/scripts/local-restart-api.sh
```

Det gør kun de sikre, reproducerbare trin:
- loader `.env`
- bringer infra op hvis Docker er tilgængelig
- `prisma validate`
- `prisma generate`
- `prisma migrate deploy`

Scriptet starter ikke en baggrundsproces selv; det ender med den præcise kommando du skal køre for API-serveren.

## 4. Start services

```bash
cd apps/api && corepack pnpm dev
cd apps/web && corepack pnpm dev
```

## 5. Typisk release-check lokalt

```bash
bash infra/scripts/local-doctor.sh
bash infra/scripts/infra-up.sh
bash infra/scripts/local-restart-api.sh
bash infra/scripts/runtime-refresh.sh
curl http://localhost:4001/healthz
curl http://localhost:4001/readyz
curl http://localhost:4001/api/v1/overview
```

## Notes

- Root-scripts bruger nu `corepack pnpm ...` for Prisma-paths, så de virker på hosts uden global `pnpm` shim.
- Hvis hosten ikke har Docker, vil `local-doctor.sh` stadig give et ærligt billede i stedet for at skjule driftshuller.
- Runtime refresh bruger samme fælles env/root-helpers som resten af infra-scripts, så stier og `.env`-loading er konsistente.
