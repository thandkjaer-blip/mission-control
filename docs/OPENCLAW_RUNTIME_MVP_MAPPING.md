# OpenClaw runtime → Mission Control domain mapping (MVP)

## Goal
Map real OpenClaw runtime data into the existing Mission Control MVP domain **without pretending the runtime is a full orchestrator**.

For MVP, Mission Control should treat OpenClaw as an eventful conversational runtime with:
- a top-level **session**
- zero or more **subagent sessions / lanes**
- a mixed stream of **user / assistant / tool / system activity**

The read model should be stable even when some fields are inferred rather than explicitly emitted by OpenClaw.

---

## 1. Primary entity mapping

### 1.1 Workflow ← OpenClaw session
**Rule:** one OpenClaw session maps to one Mission Control `workflow`.

**Why:** the session is the highest stable execution container with a goal, chronology, and outcome.

**Workflow identity**
- `workflows.id` = stable derived ID from OpenClaw `sessionId` if no native UUID exists in source ingest
- `metadata.runtime.sessionId` = raw OpenClaw session id
- `metadata.runtime.source` = `openclaw`
- `metadata.runtime.channel` = source channel (`webchat`, `discord`, etc.) if known
- `metadata.runtime.parentSessionId` = present only if source says this session itself is a subagent

**Workflow naming**
- Prefer authoritative runtime label/title if available
- Else derive from first user request / task label
- Mark derived title in `metadata.titleDerived = true`

### 1.2 Agent ← OpenClaw lane / subagent session
**Rule:** each active execution lane maps to one Mission Control `agent` record.

For MVP there are two lane classes:
1. **main lane** = the primary assistant in the top-level session
2. **subagent lane** = each spawned subagent/session

**Agent identity**
- Main lane agent id: deterministic `agent:{sessionId}:main`
- Subagent agent id: deterministic `agent:{sessionId}:{subagentSessionId}` or raw subagent session id if globally unique
- `agents.worker_id` = raw runtime lane/session identifier
- `agents.metadata.runtime.sessionId` = owning top-level OpenClaw session
- `agents.metadata.runtime.laneType` = `main` | `subagent`
- `agents.metadata.runtime.label` = subagent label if present

**Agent type**
Existing enum values (`programmer`, `uiux`, etc.) are not authoritative for OpenClaw runtime lanes.
For MVP:
- map all OpenClaw lanes to a default operational type, preferably `programmer` as neutral catch-all in current schema
- preserve the real runtime role in `agents.metadata.runtime.role`
- preserve subagent label/name in `agents.name`

This is slightly ugly, but safer than inventing fake type certainty.

### 1.3 Task ← bounded unit of assistant work
**Rule:** create a `task` only for meaningful work units, not every message.

A Mission Control task should represent one of:
- an explicit user request handled in the session
- a subagent assignment
- a tool execution group with a clear goal/result
- a command/approval operation requiring tracking

**Do not create a task for** every token/message/tool call. Those belong in `events`.

**Task granularity for MVP**
- Top-level user ask → one top-level task under the workflow
- Each spawned subagent assignment → one child task assigned to that subagent agent
- Long-running tool/action step may become its own task **only** if it has a lifecycle beyond a single event burst

---

## 2. Event mapping

### 2.1 Events are the authoritative activity ledger
OpenClaw activity is best preserved first as Mission Control `events`.

Create events for:
- user message received
- assistant response started/completed
- subagent spawned/completed/failed
- tool call requested
- tool call completed/failed
- approval required
- command emitted/result received
- session completed/aborted
- explicit error/warning signals

### 2.2 Recommended event types
Use stable `event_type` strings under an `openclaw.*` namespace:
- `openclaw.session.started`
- `openclaw.session.completed`
- `openclaw.session.failed`
- `openclaw.message.user`
- `openclaw.message.assistant`
- `openclaw.subagent.spawned`
- `openclaw.subagent.completed`
- `openclaw.subagent.failed`
- `openclaw.tool.requested`
- `openclaw.tool.succeeded`
- `openclaw.tool.failed`
- `openclaw.command.pending`
- `openclaw.command.executing`
- `openclaw.command.succeeded`
- `openclaw.command.failed`
- `openclaw.approval.required`
- `openclaw.warning`
- `openclaw.error`

### 2.3 Event linkage
Every ingested event should link to as many domain IDs as confidently known:
- always `workflow_id`
- `agent_id` when activity belongs to a specific lane/subagent
- `task_id` when activity belongs to a known bounded work unit
- `correlation_id` = raw tool call id / command id / subagent id when available

---

## 3. Status mapping rules

## 3.1 Workflow status
`workflow.status` should be mostly **derived** from session lifecycle + descendant state.

### Authoritative workflow states
Use these when OpenClaw clearly signals them:
- `running` when session is active
- `completed` when session exits normally
- `failed` when session terminates with unhandled error / explicit failure
- `cancelled` when session is explicitly stopped/cancelled

### Heuristic workflow states
Use these when runtime lacks an explicit terminal marker:
- `pending` only before first assistant/tool/subagent activity is seen after session creation
- `partial` when session has completed but one or more child tasks/subagents failed while the top-level session still returned a response

### Workflow rollup heuristics
If no explicit session terminal event exists:
- `running` if any mapped agent/task is active and latest activity is fresh
- `completed` if all known child tasks are terminal and latest assistant turn looks final
- `failed` if latest authoritative runtime event is an error and no later recovery exists

## 3.2 Agent status
`agent.status` is mainly **derived** from recent lane activity.

Mapping:
- `working` = lane has in-flight assistant generation, active tool call, or live child work
- `idle` = lane alive, no in-flight work, recent heartbeat/activity still fresh
- `degraded` = lane stale beyond freshness threshold or repeated tool failures/retries
- `failed` = lane/subagent ended with failure
- `stopped` = lane explicitly exited or subagent completed and is no longer expected to emit activity
- `starting` = lane/subagent announced/created but has not yet emitted useful work

## 3.3 Task status
Tasks are a mix of authoritative and derived state.

### Top-level user request task
- `pending` = request ingested but assistant has not started meaningful work
- `running` = assistant is reasoning/responding, tool is active, or subagent work is in progress
- `blocked` = waiting on approval, dependency, or prerequisite tool result
- `retrying` = previous tool/subtask failed and retry attempt is in progress
- `completed` = assistant delivered final response for this work unit without unresolved child failure
- `failed` = explicit failure with no later recovery
- `cancelled` = user/operator/runtime cancelled it

### Subagent assignment task
- `queued` = subagent requested but not started
- `running` = subagent started and is active
- `completed` = subagent finished successfully
- `failed` = subagent finished with failure
- `cancelled` = subagent cancelled before completion

### Tool-backed task/command status bridge
Single tool calls should usually stay as events.
Create/update `control_commands` only for operator-like or approval-sensitive actions.

---

## 4. Command mapping

Use `control_commands` only when the runtime is effectively doing a command pipeline action, e.g.:
- tool execution with approval gate
- restart/stop/start style control operations
- command objects that already have `pending/executing/succeeded/failed`

Mapping:
- tool/command requested → `pending`
- approval granted → `approved`
- execution started → `executing`
- success result → `succeeded`
- failure result → `failed`
- cancelled before run/finish → `cancelled`

Regular conversational tool usage that is low-level and numerous should remain event-only in MVP to avoid command-table spam.

---

## 5. Freshness / staleness contract

Because OpenClaw is not guaranteed to emit canonical heartbeats for every lane, MVP freshness must use **latest observed activity timestamp**.

## 5.1 Authoritative freshness source
Prefer in this order:
1. explicit runtime heartbeat timestamp
2. explicit state transition timestamp
3. latest event timestamp for that lane/session
4. latest structured log timestamp for that lane/session

## 5.2 Recommended thresholds
Use channel/runtime-configurable thresholds, defaulting to:
- **fresh:** activity within 30s
- **warning/stale:** no activity for >30s and <=120s while expected active
- **critical/stuck:** no activity for >120s while task/agent/workflow still marked active

## 5.3 When staleness matters
Apply staleness only when the entity is expected to be active:
- running workflow
- working/starting agent
- running/queued/retrying task
- executing/pending command

Do **not** mark completed/stopped/cancelled entities stale.

## 5.4 Derived health rule
- fresh active entity → normal current status
- stale active entity → keep domain status, but downgrade `health` to `warning`
- critically stale active entity → promote `health` to `critical` and optionally emit `agent_stuck` / `workflow_stale` alert

This preserves semantic status (`running`) while showing operational risk (`critical`).

---

## 6. Authoritative vs heuristic fields

## 6.1 Treat as authoritative when present in runtime
- raw session id / subagent id
- raw timestamps from runtime
- explicit approval-required markers
- explicit command/tool result
- explicit terminal success/failure/cancel outcome
- explicit parent/child session relation
- raw channel and label names

## 6.2 Treat as heuristic / derived in Mission Control
- workflow title when not provided
- agent type (`programmer`, etc.) for OpenClaw lanes
- task boundaries for conversational work
- workflow completion when session lacks terminal event
- agent idle vs stopped if lane simply goes quiet after success
- health and stale/stuck classification
- rollups like `failedTasks`, `completedTasks`, `currentBurnRateUsdPerHour`

## 6.3 Storage rule
Whenever a field is derived, preserve the raw source in metadata so the UI/API can distinguish:
- `metadata.runtime.*` = raw source facts
- `metadata.derived.*` = inference notes / confidence / rule used

Recommended fields:
- `metadata.derived.isHeuristic`
- `metadata.derived.reason`
- `metadata.derived.confidence` (`high` | `medium` | `low`)

---

## 7. MVP ingestion contract by source activity

### User message
- append `openclaw.message.user` event
- create top-level task if this begins a new work unit
- keep workflow `running`

### Assistant message / progress update
- append `openclaw.message.assistant` event
- move related task to `running` unless already terminal
- mark owning agent `working` or `idle` depending on whether more work is expected

### Subagent spawn
- append `openclaw.subagent.spawned`
- create child task for assignment
- create/update subagent-backed `agent`
- set child task `queued` or `running` depending on first seen activity

### Subagent completion
- append terminal subagent event
- set child task `completed` / `failed`
- set subagent agent `stopped` or `failed`

### Tool start/result
- append tool events always
- update parent task to `running` / `retrying` / `failed` / `completed` as appropriate
- only create `control_commands` for approval-sensitive or operator-like commands

### Approval requested
- append `openclaw.approval.required`
- set related task `blocked`
- create or update command as `pending` with `approval_required = true`

### Session end
- append terminal session event
- resolve open tasks heuristically if needed
- set workflow terminal status
- transition main agent to `stopped` unless a stronger failure state exists

---

## 8. Practical MVP rules to keep the system robust

1. **Events first, rollups second.** Never drop source activity just because task mapping is ambiguous.
2. **One workflow per session.** Do not split a single OpenClaw session into multiple workflows in MVP.
3. **One agent per lane/subagent session.** This gives stable operator mental models.
4. **Task creation should be conservative.** Too few tasks is safer than task spam.
5. **Health != status.** Use stale logic to affect health/alerts before forcing status flips.
6. **Preserve raw identifiers in metadata.** Future reconciliation depends on this.
7. **Prefer deterministic IDs.** Re-ingestion must upsert cleanly.

---

## 9. Minimum schema-fit notes against current Mission Control repo

This mapping fits the current schema with minimal/no schema changes:
- `workflows` = OpenClaw sessions
- `agents` = main lane + subagent lanes
- `tasks` = user asks + subagent assignments + selected long-running steps
- `events` = canonical source activity ledger
- `control_commands` = approval/control/tool commands worth explicit lifecycle tracking
- `alerts` = stale lane/workflow, repeated tool failure, approval timeout

### Biggest current mismatch
`agents.type` is currently a product-role enum, not a runtime-lane enum.
For MVP, store the true OpenClaw lane role in metadata and use a neutral fallback enum value. Long-term, this should become either:
- a broader enum, or
- `agent_kind` + `agent_role` split

---

## 10. Recommended next implementation step

Implement ingestion in this order:
1. raw OpenClaw activity → `events`
2. session/lane upsert → `workflows` + `agents`
3. conservative task projection → `tasks`
4. freshness reconciler → `health`, stale alerts, derived status cleanup
5. optional command projection for approval-sensitive actions
