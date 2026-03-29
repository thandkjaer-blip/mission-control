# Runtime refresh runbook

Mission Control kan nu genindlæse rigtige OpenClaw-sessioner via en lille, eksplicit refresh-kommando i stedet for en manuel engangskørsel.

## Normal vej

Fra repo-roden:

```bash
bash infra/scripts/runtime-refresh.sh
```

Eller via Mission Control API/UI når API-serveren kører:

```bash
curl http://localhost:4001/api/v1/runtime-source
curl -X POST http://localhost:4001/api/v1/runtime-source/refresh
```

Det gør følgende sikkert og forudsigeligt:
- loader `.env` hvis den findes
- bruger OpenClaw standard-index som default:
  - `/home/open/.openclaw/agents/main/sessions/sessions.json`
- fejler tidligt hvis session-index eller `DATABASE_URL` mangler
- kører projector-importen via `corepack pnpm`, så den også virker på hosts uden global `pnpm` shim

## Overrides

Hvis OpenClaw-data ligger et andet sted:

```bash
bash infra/scripts/runtime-refresh.sh \
  --index /path/to/sessions.json \
  --source-root /path/to/jsonl-dir
```

Alternativt via env:

```bash
export OPENCLAW_SESSION_INDEX_PATH=/path/to/sessions.json
export OPENCLAW_SESSION_SOURCE_ROOT=/path/to/jsonl-dir
bash infra/scripts/runtime-refresh.sh
```

## Hvornår bruges den?

Brug den når du vil opdatere Mission Control fra den aktuelle OpenClaw-runtime:
- efter nye sessioner er kørt
- efter du har seedet/klargjort databasen
- før lokal demo eller validering af overview/agents/tasks/workflows

## UI-kobling

Overview-siden viser nu:
- hvilken OpenClaw source der er konfigureret
- om index/source-root findes
- om refresh API er enabled
- en lille `Refresh from OpenClaw`-knap, som kalder `POST /api/v1/runtime-source/refresh`

## Hvad den ikke gør

Bevidst ikke i denne pass:
- ingen baggrundsdaemon
- ingen cron
- ingen automatisk write-path fra live runtime til DB
- ingen skjult polling

Det holder integrationen lille og lavrisiko: real data bliver den normale vej ind, men kun når du eksplicit refresher.

## Forventet output

Projektoren printer et JSON-resumé som fx:

```json
{
  "ok": true,
  "workflows": 3,
  "agents": 3,
  "tasks": 3,
  "events": 42,
  "indexPath": "/home/open/.openclaw/agents/main/sessions/sessions.json",
  "sourceRoot": null
}
```

## Hurtig demo-sekvens

```bash
cp .env.example .env
bash infra/scripts/runtime-refresh.sh
curl http://localhost:4001/api/v1/overview
curl http://localhost:4001/api/v1/agents
curl http://localhost:4001/api/v1/tasks
curl http://localhost:4001/api/v1/workflows
```

Hvis API eller DB ikke er oppe endnu, så bring først infrastrukturen op og kør derefter refresh igen.
