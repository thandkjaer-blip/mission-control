# FRONTEND IMPLEMENTATION NEXT

## Purpose
This document turns `docs/FRONTEND_SHELL_PLAN.md` into implementation-ready scaffolding notes for the current `apps/web` Next.js shell.

It is written against the repo as it exists now:
- Next.js App Router in `apps/web/app`
- shared shell pieces in `apps/web/components`
- lightweight live URL helper in `apps/web/lib/live.ts`
- current MVP routes already present for overview/agents/tasks/workflows/alerts/commands

The goal here is not design polish. It is to give the next frontend pass a concrete build order, route shape, and component/data-layer contract so WP6 can move without re-deciding the shell.

---

## 1. Current state snapshot

### What already exists
- Root shell layout in `app/layout.tsx`
- Redirect from `/` to `/overview`
- Placeholder pages for:
  - `/overview`
  - `/agents`
  - `/agents/[agentId]`
  - `/tasks`
  - `/tasks/[taskId]`
  - `/workflows`
  - `/workflows/[workflowId]`
  - `/alerts`
  - `/commands`
- Basic sidebar/topbar components
- `lib/live.ts` for live endpoint URL scaffolding

### What is still missing
- Route-level implementation notes tied to actual API endpoints
- Shared primitives for list/detail/state handling
- Read-first data-fetching conventions
- Live update reconciliation rules
- A defined first-build order for real pages/components

### Important cleanup to fold into the next frontend pass
The current shell has a few parallel/overlapping pieces:
- `components/layout/*` is actively used by `app/layout.tsx`
- `components/operator-shell.tsx` and `components/shell-nav-link.tsx` look like an earlier richer shell direction
- `components/page-header.tsx` and `components/ui/page-header.tsx` overlap
- navigation currently mentions `/usage` and `/settings`, while the MVP docs prioritize `/costs`, `/audit`, and `/infrastructure`

The next implementation pass should consolidate rather than add more parallel shell patterns.

---

## 2. Route map to implement

## 2.1 MVP route priority

### P0 — must support launchable operator flows
- `/overview`
- `/agents`
- `/agents/[agentId]`
- `/tasks`
- `/tasks/[taskId]`
- `/workflows`
- `/workflows/[workflowId]`
- `/alerts`
- `/commands`

### P1 — add once read APIs/UI slices are ready
- `/alerts/[alertId]`
- `/commands/[commandId]`
- `/infrastructure`
- `/costs`
- `/audit`

### P2 — optional / later
- `/settings/profile`
- global search results route
- drawer-based contextual overlays if they still feel necessary after detail routes are solid

## 2.2 Recommended app tree

```text
app/
  page.tsx                       -> redirect('/overview')
  layout.tsx                     -> app shell
  overview/page.tsx
  agents/page.tsx
  agents/[agentId]/page.tsx
  tasks/page.tsx
  tasks/[taskId]/page.tsx
  workflows/page.tsx
  workflows/[workflowId]/page.tsx
  alerts/page.tsx
  alerts/[alertId]/page.tsx      # next
  commands/page.tsx
  commands/[commandId]/page.tsx  # next
  infrastructure/page.tsx        # next
  costs/page.tsx                 # next
  audit/page.tsx                 # next
```

## 2.3 Route-to-API map

### `/overview`
Primary reads:
- `GET /api/v1/me`
- `GET /api/v1/overview`

Live events to observe:
- `overview.updated`
- `alert.created`
- `alert.updated`
- `provider.updated`
- `command.updated`
- optionally `agent.updated`, `task.updated`, `workflow.updated` if overview cards are patched directly

### `/agents`
Primary reads:
- `GET /api/v1/me`
- `GET /api/v1/agents`

Query params to preserve in URL:
- `status`
- `type`
- `search`
- `sort`
- `page`
- `pageSize`

Live events:
- `agent.updated`
- `command.updated`

### `/agents/[agentId]`
Primary reads:
- `GET /api/v1/me`
- `GET /api/v1/agents/:agentId`
- `GET /api/v1/agents/:agentId/events`
- `GET /api/v1/agents/:agentId/logs`
- `GET /api/v1/agents/:agentId/metrics`

Live events:
- `agent.updated`
- `command.updated`
- related `task.updated` when current task changes

### `/tasks`
Primary reads:
- `GET /api/v1/me`
- `GET /api/v1/tasks`

Query params to preserve in URL:
- `status`
- `priority`
- `agentId`
- `workflowId`
- `sort`
- `page`
- `pageSize`

Live events:
- `task.updated`
- `command.updated`

### `/tasks/[taskId]`
Primary reads:
- `GET /api/v1/me`
- `GET /api/v1/tasks/:taskId`
- `GET /api/v1/tasks/:taskId/dependencies`
- `GET /api/v1/tasks/:taskId/events`
- `GET /api/v1/tasks/:taskId/logs`
- `GET /api/v1/tasks/:taskId/costs`

Live events:
- `task.updated`
- `command.updated`
- related `agent.updated` if assignment/health is surfaced inline

### `/workflows`
Primary reads:
- `GET /api/v1/me`
- `GET /api/v1/workflows`

Query params to preserve in URL:
- `status`
- `triggerType`
- `initiatedBy`
- `page`
- `pageSize`

Live events:
- `workflow.updated`
- `command.updated`

### `/workflows/[workflowId]`
Primary reads:
- `GET /api/v1/me`
- `GET /api/v1/workflows/:workflowId`
- `GET /api/v1/workflows/:workflowId/graph`
- `GET /api/v1/workflows/:workflowId/tasks`
- `GET /api/v1/workflows/:workflowId/events`
- `GET /api/v1/workflows/:workflowId/costs`

Live events:
- `workflow.updated`
- `task.updated`
- `command.updated`

### `/alerts`
Primary reads:
- `GET /api/v1/me`
- `GET /api/v1/alerts`

Query params to preserve in URL:
- `status`
- `severity`
- `type`
- `agentId`
- `taskId`
- `workflowId`
- `page`
- `pageSize`

Live events:
- `alert.created`
- `alert.updated`

### `/commands`
Primary reads:
- `GET /api/v1/me`
- `GET /api/v1/commands`

Likely query params:
- `status`
- `targetType`
- `requester`
- `page`
- `pageSize`

Live events:
- `command.updated`

---

## 3. Shell structure to standardize now

## 3.1 One shell path, not two
Adopt `app/layout.tsx` + `components/layout/sidebar.tsx` + `components/layout/topbar.tsx` as the primary shell path and retire duplicate shell components once equivalent behavior is migrated.

Concrete next step:
- keep `components/layout/*`
- merge any useful ideas from `operator-shell.tsx` into those files
- remove or stop importing duplicate shell structures after consolidation

## 3.2 Sidebar navigation target state
Replace the current minimal nav with this MVP order:
- Overview
- Agents
- Tasks
- Workflows
- Alerts
- Commands
- Infrastructure
- Costs
- Audit

Notes:
- `Usage` should become `Costs`
- `Settings` is not a near-term primary nav item for MVP operators
- infra/costs/audit can render lightweight placeholders until APIs are ready, but the IA should stop drifting now

## 3.3 Topbar target state
Topbar should become a stable shell-level status band with four concerns:
- environment label
- current user + role from `GET /api/v1/me`
- live transport state from `/api/v1/live`
- data freshness / last updated marker

Recommended display contract:
- left: environment + page breadcrumb/title
- right: role, user identity, live badge, stale badge, refresh action

---

## 4. Shared component primitives to build first

These primitives should be built before deep page implementation so every page does not improvise its own patterns.

## 4.1 Shell primitives
- `AppSidebar`
- `AppTopbar`
- `PageHeader`
- `EntityHeader`
- `TabNav`
- `Breadcrumbs`

## 4.2 State primitives
- `StatusBadge`
  - shared semantics for healthy / degraded / failed / pending / running / paused / critical / resolved
- `LiveIndicator`
  - connected / reconnecting / stale / disconnected
- `LoadingState`
- `EmptyState`
- `ErrorState`
- `StaleDataBanner`
- `ForbiddenState`

## 4.3 Read-model primitives
- `MetricCard`
- `MetricStrip`
- `FilterBar`
- `DataTable`
- `PaginationControls`
- `KeyValueList`
- `EntityLink`
- `TimestampCell`
- `DurationCell`

## 4.4 Detail/observability primitives
- `EventList`
- `LogList`
- `MetricsPanel`
- `DependencyList`
- `WorkflowGraphPanel` (read-only MVP)
- `AttentionQueue`
- `CommandTimeline`

## 4.5 Action primitives
These can start as disabled/skeleton affordances until WP7 is wired, but the shape should be established early.
- `ActionMenu`
- `CommandDialog`
- `ReasonField`
- `CommandStatusToast` or inline status banner

## 4.6 Component cleanup callout
There is already duplication around `PageHeader`. Standardize on one exported page-header primitive and update imports everywhere before building more.

---

## 5. Data-fetching strategy

## 5.1 Read-first rule
Every page should follow the same pattern:
1. read session/role (`GET /api/v1/me`) at shell level
2. fetch route data from REST
3. render stable page state
4. layer live updates on top
5. reconcile through refetch/invalidations when event payloads are partial

This matches the API docs and keeps correctness ahead of clever optimistic UI.

## 5.2 Recommended frontend data layer
Adopt a query/caching layer rather than page-local `useEffect` fetch sprawl.

Recommended choice:
- TanStack Query for cache, invalidation, loading/error states, and query-key discipline

Suggested structure:
```text
apps/web/
  lib/api/
    client.ts
    query-client.ts
    query-keys.ts
    fetch-json.ts
  lib/queries/
    me.ts
    overview.ts
    agents.ts
    agent-detail.ts
    tasks.ts
    task-detail.ts
    workflows.ts
    workflow-detail.ts
    alerts.ts
    commands.ts
```

## 5.3 Query key conventions
Use stable keys that match the route model:
- `['me']`
- `['overview']`
- `['agents', filters]`
- `['agent', agentId]`
- `['agent-events', agentId, filters]`
- `['agent-logs', agentId, filters]`
- `['agent-metrics', agentId, filters]`
- `['tasks', filters]`
- `['task', taskId]`
- `['task-dependencies', taskId]`
- `['task-events', taskId, filters]`
- `['task-logs', taskId, filters]`
- `['task-costs', taskId, filters]`
- `['workflows', filters]`
- `['workflow', workflowId]`
- `['workflow-graph', workflowId]`
- `['workflow-tasks', workflowId, filters]`
- `['workflow-events', workflowId, filters]`
- `['workflow-costs', workflowId, filters]`
- `['alerts', filters]`
- `['commands', filters]`

## 5.4 URL state rules for list pages
List-page filters should live in search params, not local-only state.

This is required for:
- back-navigation that preserves triage context
- sharable URLs
- consistent filter resets
- predictable refetch/query-key behavior

Each list route should parse search params into one typed filter object and pass that to the query layer.

## 5.5 Server vs client composition
Recommended bias:
- keep route entry pages as server components when helpful for initial framing/params
- use client components for filter bars, tables, tabs, live indicators, and interactive detail panels
- do not scatter fetch logic across many leaf components

Practical pattern:
- page route composes a small number of section containers
- section containers own one query each where possible
- reusable presentational components stay data-agnostic

---

## 6. Live-update strategy

## 6.1 Shared live client
Expand `lib/live.ts` into a real shell-level live client abstraction.

Suggested responsibilities:
- compute live URL
- open/reopen WebSocket
- expose connection state
- track `lastMessageAt`
- detect stale connection after timeout
- broadcast parsed events to page/query logic

Suggested files:
```text
lib/live/
  client.ts
  provider.tsx
  events.ts
  reducer.ts
  use-live-status.ts
  use-live-event.ts
```

## 6.2 Update policy: patch only when trivial
MVP rule:
- patch local cache directly for obvious, narrow changes
- invalidate/refetch for anything ambiguous or aggregate-heavy

Examples:
- `command.updated` for a visible command row -> patch row if payload includes `commandId` and status
- `agent.updated` on agent detail page -> patch top summary if payload is complete enough
- `overview.updated` -> refetch `['overview']`
- `task.updated` affecting workflow graph/tasks counts -> refetch workflow detail slices instead of hand-maintaining client graph state

## 6.3 Staleness UX rules
If live connection is down:
- keep current REST data visible
- show shell-level warning badge/banner
- show last updated time
- allow manual refresh
- never imply the UI is live when it is not

## 6.4 Event-to-invalidation map
Start with simple invalidation logic:
- `overview.updated` -> invalidate `['overview']`
- `agent.updated` -> invalidate `['agents', *]` and `['agent', agentId]`
- `task.updated` -> invalidate `['tasks', *]` and `['task', taskId]`
- `workflow.updated` -> invalidate `['workflows', *]` and `['workflow', workflowId]`
- `alert.created` / `alert.updated` -> invalidate `['alerts', *]`, maybe `['overview']`
- `command.updated` -> invalidate `['commands', *]` plus affected entity detail if target is known
- `provider.updated` -> invalidate `['overview']` and later infrastructure queries

Keep it coarse first. Refine only if over-fetching becomes a measured problem.

---

## 7. Page implementation notes

## 7.1 Overview page
Build as five sections in this order:
1. shell freshness/status strip
2. KPI cards
3. provider health strip
4. attention queues
5. recent command/activity feed

First useful components:
- `MetricStrip`
- `MetricCard`
- `AttentionQueue`
- `ProviderStatusList`
- `LiveIndicator`

Minimum behavior:
- KPI cards link into filtered list routes
- generatedAt is surfaced visibly
- overview distinguishes empty-good from empty-bad/data-missing

## 7.2 Agents list page
Build around triage table, not profile cards.

Sections:
- page header with count and quick filters
- filter bar
- agents table
- pagination footer

Columns:
- agent
- status
- type
- current task
- current workflow
- heartbeat freshness
- last error

Must-have interactions:
- row click -> `/agents/[agentId]`
- query-string-backed filters
- heartbeat freshness visually distinct from generic status

## 7.3 Agent detail page
Use tabs/sections:
- Summary
- Events
- Logs
- Metrics

Header should include:
- agent name/id
- status badge
- type/pool
- heartbeat freshness
- current task link
- commands area placeholder

## 7.4 Tasks list page
Optimize for failure/stuck-work triage.

Columns:
- task
- status
- priority
- workflow
- assigned agent
- duration
- retries/failure marker
- last updated

Must-have interactions:
- pre-filter from overview cards
- pivot to agent/workflow links directly from rows

## 7.5 Task detail page
Use tabs/sections:
- Summary
- Dependencies
- Events
- Logs
- Costs

Important MVP note:
Dependencies can start as structured upstream/current/downstream lists. A fancy graph is optional here.

## 7.6 Workflows list page
Columns:
- workflow
- status
- trigger type
- initiated by
- task counts
- running duration
- total cost

## 7.7 Workflow detail page
Use tabs/sections:
- Summary
- Graph
- Tasks
- Events
- Costs

Important MVP note:
The graph should be read-only and diagnostic-first. Clicking a node should route to `/tasks/[taskId]`.

## 7.8 Alerts page
Even before full alert detail exists, the list should support:
- severity
- status
- type
- source entity
- created time
- entity deep links

## 7.9 Commands page
This page exists to build operator trust in actions.

Columns:
- command type
- target entity
- requester
- status
- created at
- last updated

It should be easy to confirm whether a retry/restart/rerun request is still pending, executing, succeeded, or failed.

---

## 8. RBAC-aware rendering rules

Use `GET /api/v1/me` as a shell bootstrap dependency and centralize permission checks in one helper layer.

Recommended helpers:
- `canViewAudit(role)`
- `canManageAlerts(role)`
- `canRestartAgent(role)`
- `canStopAgent(role)`
- `canRetryTask(role)`
- `canRerunWorkflow(role)`
- `canScaleAgents(role)`

UI rules:
- hide action affordances the role clearly cannot use
- keep read surfaces available per API spec
- still handle backend `FORBIDDEN` responses with explicit UI states/messages

---

## 9. First pages/components to build in order

This is the recommended build order for the next frontend pass.

## Phase 1 — consolidate shell and primitives
1. Unify `PageHeader` into one component
2. Consolidate shell implementation around `app/layout.tsx` + `components/layout/*`
3. Update sidebar IA to MVP nav target state
4. Add `StatusBadge`, `LiveIndicator`, `LoadingState`, `EmptyState`, `ErrorState`
5. Add typed API client + query client scaffolding
6. Add role/session bootstrap around `GET /api/v1/me`

### Definition of done for phase 1
- one shell path
- one page-header primitive
- one data-fetching pattern
- visible live/session/freshness shell states

## Phase 2 — make overview real first
7. Implement `overview` query
8. Build status strip + KPI cards + provider strip
9. Add attention queue placeholders backed by overview payload or temporary stubs if backend slices are not ready
10. Wire KPI deep links into filtered list routes
11. Connect overview live invalidation

### Why overview first
It forces the shell-wide decisions early: query layer, live status, stale handling, metric cards, and cross-route linking.

## Phase 3 — build the first reusable list pattern on agents
12. Implement shared `FilterBar`, `DataTable`, and `PaginationControls`
13. Implement `/agents` with URL-backed filters
14. Implement `/agents/[agentId]` summary shell + tabs + linked subqueries scaffolding
15. Add live invalidation for agents list/detail

### Why agents first
Agents are a simpler first list/detail pair than tasks/workflows and exercise heartbeat freshness, detail tabs, and command placeholders.

## Phase 4 — build tasks triage flow
16. Implement `/tasks`
17. Implement `/tasks/[taskId]`
18. Add dependency view primitive
19. Add entity cross-links to workflow and agent
20. Add task live invalidation

## Phase 5 — build workflow drill-down flow
21. Implement `/workflows`
22. Implement `/workflows/[workflowId]`
23. Build `WorkflowGraphPanel` MVP version
24. Add task-list tab within workflow detail
25. Add workflow live invalidation

## Phase 6 — action confidence surfaces
26. Implement `/alerts` list
27. Implement `/commands` list
28. Add command state badge/timeline primitive
29. Add action placeholders/dialog scaffolding in detail headers

This order supports the MVP flows in the shell plan without overbuilding lesser-priority pages first.

---

## 10. Immediate implementation checklist

Use this as the next concrete frontend to-do list.

- [ ] Replace nav entries for `Usage`/`Settings` with MVP IA entries
- [ ] Consolidate duplicate shell/page-header components
- [ ] Introduce shared query/data-layer scaffolding
- [ ] Bootstrap `GET /api/v1/me` at shell level
- [ ] Expand live client from URL helper to connection-state provider
- [ ] Implement real `/overview` page sections
- [ ] Build reusable `StatusBadge`, `LiveIndicator`, `FilterBar`, `DataTable`
- [ ] Implement `/agents` list with URL-backed filters
- [ ] Implement `/agents/[agentId]` tab shell
- [ ] Implement `/tasks` and `/tasks/[taskId]`
- [ ] Implement `/workflows` and `/workflows/[workflowId]`
- [ ] Add `/alerts/[alertId]` and `/commands/[commandId]` when list/detail flow needs them

---

## 11. Done means
This frontend scaffolding track is in good shape when the next contributor can open `apps/web` and immediately see:
- the exact routes to implement,
- the shared components they are expected to build/reuse,
- how REST reads and live updates should work together,
- and the page/component order that gets Mission Control to a coherent MVP shell fastest.
