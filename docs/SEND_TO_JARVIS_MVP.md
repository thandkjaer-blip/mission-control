# Send til Jarvis — hurtigste sikre MVP

## Mål
Få en reel write path fra Mission Control til Jarvis/OpenClaw med mindst mulig kompleksitet, men uden at springe audit, persistence og fejlsporbarhed over.

MVP'en skal kunne:
- tage imod en operator-kommando fra UI
- persistere den som `control_commands`
- dispatch'e den til en lille lokal executor
- køre en kontrolleret OpenClaw-integration
- opdatere command lifecycle i databasen
- pushe `command.updated` til UI senere

Ikke mål i første slice:
- fuld RBAC/auth
- generisk command bus på tværs af mange runtimes
- bidirectional streaming af hele OpenClaw session output
- kompleks scheduler/orchestrator

---

## Anbefalet MVP-retning

### Vælg dette nu
**Mission Control API -> DB (`control_commands`) -> lokal executor worker -> `openclaw` shell-out -> DB status updates -> live event**

Det er den hurtigste vej, fordi repoet allerede har:
- `control_commands` i Prisma schema
- Fastify API
- Redis plugin til live/pubsub hvis vi vil bruge det
- WebSocket-stub med `command.updated` i shared live event types

### Hvorfor ikke direkte web -> OpenClaw?
Det ville være hurtigere i 10 minutter, men dårligt i praksis:
- ingen audit trail
- ingen retry-/timeout-model
- ingen command lifecycle til UI
- svært at debugge og genafspille
- web server request ville blokere på et eksternt shell-kald

---

## Centrale designvalg

### 1. Command som autoritativ state machine
Brug `control_commands` som source of truth.

Statusforløb i MVP:
- `pending` — oprettet og klar til dispatch
- `approved` — optional; kun hvis vi senere kræver manuel godkendelse
- `executing` — worker har claimet command og kører integration
- `succeeded` — OpenClaw accepterede/udførte kommandoen
- `failed` — validering/integration/runtime fejl
- `cancelled` — kun før execution i MVP

### 2. Ét smalt command-format først
Start med én write path til Jarvis som et **tekstligt operator prompt/input** i stedet for mange handlingstyper.

Forslag:
- `type = "send-to-jarvis"`
- `targetType = "agent"`
- `targetId = "jarvis"` eller senere et rigtigt agent-id
- `payload = { message, mode, idempotencyKey?, context? }`

Det giver hurtig værdi og matcher den reelle brugerintention: “send noget til Jarvis”.

### 3. Executor som separat proces, ikke inline i POST handler
POST endpoint skal kun:
- validere input
- gemme command
- skrive audit log
- evt. trigge wakeup via Redis/pubsub
- returnere `202 Accepted`

Selve shell-out skal ske i en worker-loop. Det beskytter API'et mod hangs, timeouts og dobbeltkørsler.

---

## API-shape

### Primært endpoint
`POST /api/v1/commands/send-to-jarvis`

Request:
```json
{
  "message": "Tjek status på gateway og svar kort",
  "reason": "Operator escalation from Mission Control overview",
  "mode": "default"
}
```

Response (`202 Accepted`):
```json
{
  "commandId": "uuid",
  "status": "pending",
  "targetType": "agent",
  "targetId": "jarvis",
  "queuedAt": "2026-03-29T11:10:00.000Z"
}
```

### Liste/detail til UI
Genbrug den generelle commands-flade fra API_V1:
- `GET /api/v1/commands?targetType=agent&targetId=jarvis`
- `GET /api/v1/commands/:commandId`
- `POST /api/v1/commands/:commandId/cancel` (kun hvis endnu ikke `executing`)

### Senere, men kompatibelt
Hvis man vil have per-target endpoints senere:
- `POST /api/v1/agents/jarvis/commands/send`

Men til MVP er et generisk top-level endpoint enklere at bygge og lettere at genbruge.

---

## Payload-kontrakt for MVP

```ts
interface SendToJarvisCommandPayload {
  message: string;
  mode?: 'default' | 'safe';
  reason?: string;
  idempotencyKey?: string;
  context?: {
    source?: 'mission-control';
    page?: string;
    actorDisplayName?: string;
  };
}
```

### Regler
- `message`: required, trimmed, max fx 4000 chars
- `mode=default`: normal dispatch
- `mode=safe`: reserveret til senere policy-stramning
- `idempotencyKey`: optional, men meget nyttig mod dobbeltklik

---

## Persistence-design

Eksisterende `control_commands` er næsten nok som den er.

### Brug eksisterende felter sådan her
- `type`: `send-to-jarvis`
- `targetType`: `agent`
- `targetId`: `jarvis`
- `payload`: selve input payload
- `requestedBy`: display name eller user id string fra `me`
- `status`: lifecycle
- `approvalRequired`: `false` i første MVP
- `executionStartedAt` / `executionFinishedAt`: worker timings
- `executionResult`: normaliseret integration-resultat
- `error`: struktureret fejlobjekt
- `correlationId`: request-id / idempotency / UI trace

### Lille schema-udvidelse jeg ville overveje
Ikke nødvendigt dag 1, men stærkt nyttigt meget hurtigt:
- `external_ref` / `executor_ref` til OpenClaw session/job id
- evt. `statusMessage` eller læg den i `executionResult.summary`

MVP kan dog fint klare sig uden schema-ændring ved at lægge refs i `executionResult`.

---

## OpenClaw-integration: hurtigste sikre variant

## Anbefaling
Lav en lille adapter i API-appen eller som worker-helper, der sheller ud til OpenClaw med et **stramt, kontrolleret kommandoformat**.

### Vigtig pointe
MVP'en skal **ikke** lade UI sende arbitrary shell til maskinen. Mission Control sender kun struktureret payload, og adapteren oversætter til et kendt OpenClaw-kald.

### Foreslået integrationslag
Ny modul-retning:
- `apps/api/src/modules/commands/`
  - `schemas.ts`
  - `service.ts`
  - `executor.ts`
  - `openclaw-adapter.ts`
  - `events.ts`

### Shell-out strategi
Adapteren bruger `child_process.spawn`/`execFile`, ikke interpoleret `bash -lc` med rå brugerinput.

Pseudo:
```ts
spawn('openclaw', ['message', '--agent', 'jarvis', '--text', payload.message], {
  env: safeEnv,
  cwd: workspace,
  stdio: 'pipe'
})
```

Hvis det konkrete CLI-kald er anderledes, er pointen stadig:
- brug argument-array
- ingen rå shell interpolation
- fast whitelistet subcommand
- timeout
- stdout/stderr capture

### Hvis OpenClaw CLI ikke har et godt non-interaktivt send-command
Så er næstbedste MVP:
1. skriv command til DB
2. executor skriver en køfil/JSONL outbox i en kendt mappe
3. en separat lokal bro-proces læser outbox og sender til OpenClaw/session

Men kun hvis CLI'et mangler en brugbar non-interaktiv path. Ellers er direkte adapter enklest.

---

## Konkret kontrolflow

### A. Oprettelse
1. UI poster `message` til `POST /api/v1/commands/send-to-jarvis`
2. API validerer body med Zod
3. API slår current user op (`/me`-model eller request context)
4. API opretter `control_commands` row med `pending`
5. API opretter `audit_logs` row: `action=command.requested`
6. API publicerer wakeup event, fx Redis kanal `mission-control.commands`
7. API returnerer `202` med `commandId`

### B. Dispatch/execution
1. Worker finder næste command med `status in ('pending','approved')` og `type='send-to-jarvis'`
2. Worker claimer command atomisk til `executing`
3. Worker sætter `executionStartedAt`
4. Worker kalder OpenClaw-adapter
5. Adapter returnerer normaliseret resultat
6. Worker opdaterer command til `succeeded` eller `failed`
7. Worker skriver audit/event/live-notifikation

### C. UI-opdatering
- Commands-side læser `GET /api/v1/commands`
- senere modtager den `command.updated` over WebSocket
- detailvisning kan poll'e eller subscrib'e på commandId

---

## Claiming / concurrency

Det vigtigste edge case i MVP er dobbeltkørsel.

### Sikker claim-model
Brug en atomisk DB update som claim:
- vælg kandidat-id
- `updateMany where id=? and status='pending'`
- hvis affected rows = 1, ejer worker commanden
- ellers er den allerede taget

Alternativt med Postgres mere elegant senere:
- `FOR UPDATE SKIP LOCKED`

Men `updateMany`-claim er nok til MVP og let at forstå.

---

## Fejltilstande der skal modelleres

### 1. Valideringsfejl
Eksempler:
- tom besked
- for lang besked
- ukendt mode

Returnér `400 VALIDATION_ERROR`.

### 2. Auth/RBAC-fejl
Selvom auth er dev-mode nu, designet bør have plads til:
- viewer må ikke sende
- auditor må ikke sende

Returnér `403 FORBIDDEN`.

### 3. Duplikat/dobbeltklik
Hvis samme `idempotencyKey` ses for samme aktør + target inden for kort tid:
- returnér eksisterende command i stedet for at oprette ny

Hvis man ikke vil indføre DB-constraint nu, kan det udskydes, men det er et godt lille løft.

### 4. Executor ikke tilgængelig
API må stadig acceptere kommandoen, hvis persistence virker.
Command bliver stående i `pending`.
UI skal kunne vise “queued / awaiting executor”.

### 5. OpenClaw CLI mangler / returnerer fejl
Markér command som `failed` med fx:
```json
{
  "code": "OPENCLAW_EXEC_FAILED",
  "message": "openclaw exited with code 1",
  "details": { "exitCode": 1, "stderr": "..." }
}
```

### 6. Timeout mod OpenClaw
Hvis ingen afslutning inden fx 30s/60s:
- kill child process
- markér `failed`
- error code `OPENCLAW_TIMEOUT`

### 7. Ukendt delivery-semantik
Hvis OpenClaw svarer uklart, så brug konservativ semantik:
- kun `succeeded` hvis adapteren kan afgøre accept/levering
- ellers `failed` eller `executionResult.accepted=false`

### 8. API crash efter create, før dispatch-notifikation
Ikke farligt hvis worker også periodisk scanner DB for `pending`.
Det bør den gøre.

---

## Hvordan UI bør vise lifecycle

### Commands-listen nu
Erstat hardcoded rows i `apps/web/app/commands/page.tsx` med API-data.

Vis kolonner som:
- Command
- Target
- Requested by
- Status
- Requested at
- Started at
- Finished at
- Summary

### Status mapping
- `pending`: queued
- `approved`: approved / waiting
- `executing`: sending to Jarvis…
- `succeeded`: delivered / accepted
- `failed`: failed
- `cancelled`: cancelled

### Detailpanel for en command
UI kan senere vise:
- original message
- reason
- actor
- correlation id
- execution summary
- error details
- raw stdout/stderr snippets (kun hvis sikkert og afgrænset)

### Live events
Når commanden ændres, push fx:
```json
{
  "type": "command.updated",
  "timestamp": "2026-03-29T11:15:00.000Z",
  "payload": {
    "commandId": "uuid",
    "status": "executing",
    "targetType": "agent",
    "targetId": "jarvis",
    "summary": "Dispatching message to Jarvis"
  }
}
```

Senere kan UI merge websocket-events oven på initial REST fetch.

---

## Filniveau: konkret implementeringsforslag

## 1. Shared DTO/contracts
**Nye filer eller udvidelser:**
- `packages/shared/src/dto/commands.ts`
- `packages/shared/src/index.ts`
- evt. `packages/shared/src/contracts/commands.ts`

Tilføj:
- `CommandSummaryDto`
- `CommandDetailDto`
- `CreateSendToJarvisCommandRequest`
- `CreateCommandAcceptedResponse`

## 2. API routes
**Udvid:**
- `apps/api/src/routes/api.ts`

Tilføj routes:
- `GET /api/v1/commands`
- `GET /api/v1/commands/:commandId`
- `POST /api/v1/commands/send-to-jarvis`
- evt. `POST /api/v1/commands/:commandId/cancel`

## 3. Commands module
**Nye filer:**
- `apps/api/src/modules/commands/service.ts`
- `apps/api/src/modules/commands/schemas.ts`
- `apps/api/src/modules/commands/mapper.ts`
- `apps/api/src/modules/commands/executor.ts`
- `apps/api/src/modules/commands/openclaw-adapter.ts`
- `apps/api/src/modules/commands/publisher.ts`

Ansvar:
- `schemas.ts`: zod request validation
- `service.ts`: create/list/detail/cancel
- `mapper.ts`: Prisma -> DTO
- `executor.ts`: claim loop + status transitions
- `openclaw-adapter.ts`: spawn/timeout/result normalization
- `publisher.ts`: websocket/redis event emission

## 4. API app bootstrap
**Udvid evt.:**
- `apps/api/src/server.ts`
- eller `apps/api/src/app.ts`

Start en let background executor i API-processen for første MVP.

Det er ikke perfekt arkitektur, men det er den hurtigste fungerende vej.
Senere kan executor løftes ud i egen process uden at ændre API-kontrakten.

## 5. Web app
**Udvid:**
- `apps/web/lib/api.ts`
- `apps/web/app/commands/page.tsx`
- evt. ny component `apps/web/components/command-status-badge.tsx`
- evt. ny compose/send form component

Første UI-slice:
- fetch commands fra API
- simpel form med textarea + submit “Send til Jarvis”
- optimistisk ikke nødvendig; brug returneret `commandId`

## 6. Live transport
**Udvid:**
- `packages/shared/src/live/events.ts`
- `apps/api/src/routes/api/v1/live.ts`
- `apps/web/lib/live.ts`

`command.updated` findes allerede i type-unionen, så det er lav-friktion at koble på.

---

## Background executor: MVP-form

### Simplest acceptable version
Kør en interval-baseret scan hvert fx 2-3 sekund:
- find pending commands for `send-to-jarvis`
- claim én ad gangen
- execute

Det er grimt, men helt fint til første slice.

### Slightly better, stadig lille
Kombinér:
- Redis pubsub wakeup ved create
- periodisk fallback scan hvert 15-30 sekund

Så får man både lav latency og robusthed ved missed wakeups.

---

## Sikkerhedsræsonnement

### Hvad gør denne MVP sikker nok?
- UI sender ikke shell, kun message payload
- server whitelist'er én command-type
- OpenClaw-kald bygges som argument-array, ikke rå shell interpolation
- alle writes persisteres og auditeres
- command execution er async og sporbar
- timeouts og exit-codes håndteres eksplicit

### Hvad er stadig ikke perfekt?
- hvis `message` senere bruges dybt i et CLI der selv er sårbart, er der stadig downstream-risiko
- auth er dev-mode lige nu
- inline executor i API-proces er ikke ideelt for isolation

Men det er et forsvarligt MVP-niveau.

---

## Konkrete edge cases jeg ville håndtere fra start

1. **Tom besked / whitespace-only**
2. **Meget lang besked**
3. **Dobbelt submit fra UI**
4. **API accepterer command, men worker er nede**
5. **Worker crasher midt i `executing`**
   - tilføj senere reconciliation for stale `executing`
6. **OpenClaw returnerer succes uden maskinlæsbar output**
7. **Jarvis/OpenClaw er ikke installeret eller ikke på PATH**
8. **Cancel request kommer samtidig med claim**
   - cancel kun hvis status endnu ikke `executing`

---

## Stale execution recovery

Ikke nødvendigt på minut 1, men næsten gratis at tænke ind:
- hvis `executing` og `executionStartedAt < now - 5 min`, marker som `failed`
- error code: `EXECUTION_STALE`

Det kan ligge i samme worker-loop som housekeeping.

---

## Anbefalet implementeringsrækkefølge

### Phase 1 — real write path, ingen fancy UI
1. DTOs for commands
2. `POST /api/v1/commands/send-to-jarvis`
3. `GET /api/v1/commands` + `GET /api/v1/commands/:id`
4. background executor
5. OpenClaw adapter med timeout + stdout/stderr capture
6. Commands page kobles til API

### Phase 2 — usability
7. simpel send-form i Commands-siden
8. cancel før execution
9. idempotencyKey fra UI
10. bedre execution summaries

### Phase 3 — live visibility
11. `command.updated` push over WebSocket
12. UI live refresh på command lifecycle
13. detail drawer med audit/error/resultat

---

## Min anbefaling i én sætning
Den bedste hurtige MVP er: **persistér “send til Jarvis” som `control_commands`, lad en lille lokal worker claime og udføre et whitelistet OpenClaw-kald via argument-baseret shell-out, og brug den samme command-record som source of truth for UI lifecycle, audit og fejltilstande.**
