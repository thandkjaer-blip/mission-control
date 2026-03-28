# FRONTEND SHELL PLAN — MVP Operator UX

## Purpose
This document translates the Mission Control MVP into a pragmatic frontend shell plan from an operator UX point of view.

It is grounded in:
- `docs/WORK_PACKAGES.md`
- `docs/API_V1.md`

It is intended to support **WP1 platform/repo scaffolding decisions** while de-risking the later **WP6 overview/agents/tasks/workflows UI** work. The focus here is not visual polish; it is a usable operator shell that can be implemented early and expanded safely.

---

## 1. MVP shell goals

The frontend shell should let an operator:
- understand current platform state within a few seconds,
- move quickly from a high-level signal to the relevant entity detail,
- understand relationships between agents, tasks, and workflows,
- perform a small set of high-value actions with confidence,
- see whether the system is live, stale, loading, or degraded.

For MVP, the UI should optimize for:
- **fast diagnosis over dense analytics**,
- **clear navigation over feature depth**,
- **safe actions over broad control surface**,
- **cross-linking and drill-down over bespoke screens**.

---

## 2. Primary operator jobs to support

The shell should be designed around these recurring jobs:

1. **Is the system healthy?**
   - Check overview, alerts, provider health, burn rate, stale/failing agents.

2. **What needs attention right now?**
   - Identify open alerts, failed tasks, blocked workflows, degraded agents.

3. **Why is this workflow/task failing or blocked?**
   - Navigate from workflow → task → assigned agent → events/logs/dependencies.

4. **Which agent is doing what?**
   - Find agent state, current task, heartbeat freshness, recent errors.

5. **Can I take a safe corrective action?**
   - Retry task, cancel task, restart/stop/start agent, rerun workflow.

These jobs map directly to the MVP package order:
- WP4 provides the read model,
- WP5 keeps the shell fresh,
- WP6 delivers core visibility,
- WP7 adds operator actions.

---

## 3. Recommended frontend shell structure

## 3.1 Global layout

Use a simple app shell with:
- **left sidebar** for primary navigation,
- **top bar** for environment/session/live status + global search,
- **main content area** for page content,
- **right-side contextual panel or slide-over** for lightweight actions/details later if needed.

This layout is a good MVP fit because operators need persistent wayfinding more than marketing-style full-width pages.

### Left navigation
Primary items:
- Overview
- Agents
- Tasks
- Workflows
- Alerts
- Commands
- Infrastructure
- Costs
- Audit

For strict MVP cutline, the first release can visually prioritize:
- Overview
- Agents
- Tasks
- Workflows
- Alerts
- Commands

And keep these present but lighter-weight if backend is not fully ready:
- Infrastructure
- Costs
- Audit

### Top bar
Include:
- environment label (`local`, `staging`, `prod`)
- current user + role from `GET /api/v1/me`
- live connection status for `/api/v1/live`
- “last updated” timestamp / stale indicator
- global search entry point

### Global shell behaviors
The shell should always make these states obvious:
- loading
- partial data
- stale live connection
- no results
- forbidden action
- command pending/executing/succeeded/failed

---

## 4. Information architecture

## 4.1 Top-level route map

Recommended MVP routes:

- `/` → redirect to `/overview`
- `/overview`
- `/agents`
- `/agents/:agentId`
- `/tasks`
- `/tasks/:taskId`
- `/workflows`
- `/workflows/:workflowId`
- `/alerts`
- `/alerts/:alertId`
- `/commands`
- `/commands/:commandId`
- `/infrastructure`
- `/costs`
- `/audit`
- `/settings/profile` (optional, low priority)

If implementation time is tight, the minimum navigable shell should ship with:
- `/overview`
- `/agents`
- `/agents/:agentId`
- `/tasks`
- `/tasks/:taskId`
- `/workflows`
- `/workflows/:workflowId`
- `/alerts`
- `/commands`

## 4.2 Entity relationship model in the UI

The frontend should treat these as the core drill-down graph:
- **Workflow** contains many tasks
- **Task** belongs to a workflow and may be assigned to an agent
- **Agent** may have a current task and recent workflow context
- **Alert** should deep-link to the relevant workflow/task/agent/command
- **Command** should link back to its target entity and audit trail

This graph is more important than any individual page. MVP success depends on preserving context while moving across these entities.

---

## 5. Overview page plan

## 5.1 Purpose
The Overview page should answer three questions immediately:
- what is broken,
- what is at risk,
- where should the operator click next.

## 5.2 Overview layout

Recommended section order, top to bottom:

### A. Critical status strip
Small, always-visible summary row:
- open alerts
- critical alerts
- infra status
- live connection state
- generatedAt freshness

This gives the operator an instant trust/readiness check before reading deeper.

### B. KPI summary cards
From `GET /api/v1/overview`:
- Agents: total / idle / working / failed / degraded
- Tasks: pending / running / failed24h
- Workflows: running / failed24h
- Cost: current burn rate / today total
- Alerts: open / critical
- Infra: overall status

Each card should be clickable into the related list screen with pre-applied filters.

Examples:
- failed agents card → `/agents?status=failed`
- failed tasks 24h → `/tasks?status=failed`
- critical alerts → `/alerts?severity=critical&status=open`

### C. Provider health section
From overview providers list, later enriched by infrastructure endpoints:
- provider name
- status
- optional latency/error hint when available

Operators need this near the top because provider incidents often explain otherwise scattered failures.

### D. Attention queues
A set of compact tables/lists:
- open critical alerts
- recently failed tasks
- degraded/stale agents
- running workflows with issues

This should be short and actionable, not a full data grid.

### E. Activity / command feed
Recent notable changes:
- latest command status changes
- latest alert changes
- latest failures/recoveries

This can start as a simple merged event list and become richer later.

## 5.3 Overview interaction rules
- Cards always link somewhere useful.
- Status chips use consistent color semantics across the whole app.
- If live updates disconnect, Overview remains usable but visibly stale.
- Empty states should say whether there is “nothing wrong” versus “data unavailable.”

---

## 6. Agents navigation and page plan

## 6.1 Agents list: `/agents`

Purpose:
- give operators fast visibility into agent fleet state,
- support filtering to find unhealthy or underutilized agents,
- enable quick jump into agent details or commands.

### Primary columns
- agent name / id
- status
- type
- current task
- current workflow (if derivable)
- heartbeat freshness
- last error / health note
- recent command state (optional)

### Filters
Aligned with API:
- status
- type
- search
- sort
- page/page size

### Key list affordances
- quick status badge scan
- stale heartbeat indicator distinct from generic failed status
- row click to detail
- inline “more actions” menu for restart/start/stop/drain when WP7 lands

## 6.2 Agent detail: `/agents/:agentId`

Recommended sections/tabs:
- Summary
- Events
- Logs
- Metrics

### Summary tab content
- current status
- type / pool
- heartbeat freshness
- current task link
- recent workflow/task activity summary
- key health indicators
- command action panel

### Events tab
Backed by `GET /api/v1/agents/:agentId/events`

### Logs tab
Backed by `GET /api/v1/agents/:agentId/logs`

### Metrics tab
Backed by `GET /api/v1/agents/:agentId/metrics`

### MVP operator actions
- restart agent
- start agent
- stop agent
- drain agent

All actions should require a reason entry and show command tracking after submission.

---

## 7. Tasks navigation and page plan

## 7.1 Tasks list: `/tasks`

Purpose:
- identify failed, stuck, pending, or expensive work,
- find ownership and workflow context quickly,
- support corrective actions.

### Primary columns
- task name / id
- status
- priority
- workflow
- assigned agent
- queued/running duration
- retries / failure indicator
- last updated

### Filters
Aligned with API:
- status
- priority
- agentId
- workflowId
- sort
- page/page size

### Important UX note
Tasks are often the main operational object. This list should be optimized for triage, not exhaustive metadata.

## 7.2 Task detail: `/tasks/:taskId`

Recommended sections/tabs:
- Summary
- Dependencies
- Events
- Logs
- Costs

### Summary tab content
- status and priority
- workflow link
- assigned agent link
- correlation id if present
- timing data
- failure/retry summary
- available actions

### Dependencies tab
Backed by `GET /api/v1/tasks/:taskId/dependencies`

MVP visualization:
- upstream list
- current node highlight
- downstream list

A full graph library is optional. A compact diagnostic dependency view is enough for blocked-task diagnosis.

### Events / Logs / Costs tabs
Directly aligned to API endpoints.

### MVP operator actions
- retry task
- cancel task
- reassign task

Reassign can be hidden behind a lower-priority interaction if backend support is not ready.

---

## 8. Workflows navigation and page plan

## 8.1 Workflows list: `/workflows`

Purpose:
- see orchestration-level health,
- identify failed or hanging runs,
- drill into task graph and aggregate cost.

### Primary columns
- workflow name / id
- status
- trigger type
- initiated by
- task counts (if available)
- running duration / last updated
- total cost summary (if available)

### Filters
Aligned with API:
- status
- triggerType
- initiatedBy
- page/page size

## 8.2 Workflow detail: `/workflows/:workflowId`

Recommended sections/tabs:
- Summary
- Graph
- Tasks
- Events
- Costs

### Summary tab content
- workflow status
- trigger type / initiated by
- start/end timing
- aggregate counts
- latest alerts affecting this workflow
- rerun / pause / resume / cancel actions

### Graph tab
Backed by `GET /api/v1/workflows/:workflowId/graph`

MVP requirement:
- read-only graph
- enough clarity to identify blocked or failed nodes
- click-through from node → task detail

### Tasks tab
Backed by `GET /api/v1/workflows/:workflowId/tasks`

This tab is essential because some operators will prefer a sortable list over a graph.

### Costs tab
Backed by `GET /api/v1/workflows/:workflowId/costs`

### MVP operator actions
- rerun workflow
- pause workflow
- resume workflow
- cancel workflow

---

## 9. Cross-cutting navigation rules

## 9.1 Link every entity to its neighbors
Every detail page should include contextual links to related entities.

Minimum cross-linking:
- agent detail → current task, recent workflows, commands
- task detail → workflow, assigned agent, dependencies, commands
- workflow detail → tasks, affected alerts, related commands
- alerts → source entity
- commands → target entity

## 9.2 Preserve filter context where practical
Operators often pivot between filtered lists and details.

Examples:
- if coming from `/tasks?status=failed`, back-navigation should preserve that context,
- detail page breadcrumbs should be predictable,
- use URL query params for list state.

## 9.3 Prefer details pages over modal overload
For MVP, full detail routes are better than heavy nested modals because:
- they are bookmarkable,
- easier to reason about,
- better for live updates and audit-safe action flows.

---

## 10. Minimal operator flows

These are the highest-value end-to-end flows the shell should support first.

## Flow 1: Triage a failure from Overview
1. Open `/overview`
2. Notice critical alert or failed task count spike
3. Click into filtered alerts or tasks list
4. Open the relevant task or workflow detail
5. Inspect logs/events/dependencies
6. Decide whether to retry task or rerun workflow
7. Submit command with reason
8. Observe command status and live state updates

## Flow 2: Investigate a degraded agent
1. Open `/agents?status=degraded` or from Overview attention queue
2. Open agent detail
3. Inspect heartbeat freshness, logs, events, current task
4. If appropriate, restart/drain/stop agent
5. Follow command result and linked task/workflow impact

## Flow 3: Diagnose blocked workflow
1. Open `/workflows?status=running` or failed/stalled queue
2. Open workflow detail
3. Inspect graph/tasks tab to identify blocked or failed node
4. Open affected task detail
5. Inspect dependencies/logs/agent assignment
6. Retry task or rerun workflow if needed

## Flow 4: Validate that a command succeeded
1. Submit action from agent/task/workflow page
2. Receive command id + pending feedback
3. Navigate to command drawer/page/history
4. Watch status transition via live updates
5. Confirm target entity state changed

## Flow 5: Answer “what changed recently?”
1. Open Overview activity feed or Commands list
2. Inspect recent failures/recoveries/commands
3. Pivot into affected entity detail if necessary

These flows should drive acceptance testing and frontend prioritization.

---

## 11. MVP pages beyond core entity views

## 11.1 Alerts page: `/alerts`
Even though the ask focuses on overview/agents/tasks/workflows, alerts are operationally too central to leave out of the shell.

### MVP list content
- severity
- status
- type
- source entity
- created time
- current assignee/acknowledger if available

### Key actions
- acknowledge
- resolve
- suppress

## 11.2 Commands page: `/commands`
This is necessary for action confidence.

### MVP list content
- command type
- target entity
- requester
- status
- created time
- last updated

Operators need a single place to verify that submitted actions are progressing.

---

## 12. Design system constraints for MVP

The frontend shell should standardize a small set of reusable primitives early:
- status badge
- metric card
- filter bar
- data table
- empty state
- error state
- live/stale indicator
- command confirmation dialog
- entity header
- event/log list

This is enough to avoid ad hoc UI without spending WP1/WP6 time on a full design system.

---

## 13. Data-fetching and live-update strategy

## 13.1 Read-first model
In line with `WORK_PACKAGES.md`, frontend implementation should assume:
- page loads come from REST read APIs first,
- live updates patch or invalidate current views,
- action results always reconcile through server state rather than optimistic-only UI.

## 13.2 Recommended view update model
For each list/detail page:
- initial fetch from REST
- subscribe to `/api/v1/live`
- on relevant event (`agent.updated`, `task.updated`, etc.), either:
  - patch local row/detail state if payload is sufficient, or
  - refetch the affected entity/list slice

MVP bias should favor correctness and simplicity over aggressive client-side event reduction.

## 13.3 Staleness handling
If live transport disconnects:
- show visible shell-level warning,
- continue serving last fetched data,
- allow manual refresh,
- timestamp data freshness.

---

## 14. RBAC-aware UX rules

Frontend must reflect, but not enforce alone, the RBAC matrix from `API_V1.md`.

### Viewer
- can see overview/agents/tasks/workflows/observability/costs/infra/alerts
- cannot see runtime action buttons

### Operator
- can see runtime action buttons for supported command types
- can acknowledge/resolve alerts

### Admin
- can access sensitive actions such as scaling and governance operations

### Auditor
- can access audit/governance read surfaces
- should not see misleading action affordances

MVP UI rule:
- hide unavailable actions when role is known,
- still handle `FORBIDDEN` responses gracefully if backend denies.

---

## 15. Frontend foundation decisions to make in WP1

To unblock delivery, WP1 should establish the following frontend shell decisions:

1. **Routing model**
   - file-based or explicit route config
   - support nested detail routes cleanly

2. **Data layer**
   - query/caching library for REST reads
   - consistent pagination/filter state handling

3. **Live client**
   - shared `/api/v1/live` client abstraction
   - reconnect and stale-state behavior

4. **Shell components**
   - sidebar, top bar, page header, table, tabs, badges, dialogs

5. **Type sharing**
   - DTO types shared from `packages/shared` or generated from OpenAPI later

6. **Permission utilities**
   - role-aware rendering helpers based on `GET /api/v1/me`

7. **URL conventions**
   - stable query params for filters/sort/page state

8. **Error/state patterns**
   - one consistent pattern for loading, empty, partial, error, stale

These are the real shell decisions. They matter more in MVP than theme choice or motion polish.

---

## 16. Proposed implementation sequence for the frontend track

### Phase A — WP1 shell scaffolding
- create web app scaffold
- add app shell layout
- add routing skeleton for primary routes
- add placeholder pages
- add shared UI primitives
- add auth/session bootstrap using `/api/v1/me`
- add live connection indicator scaffold

### Phase B — read-model integration
- wire `/overview`
- wire `/agents` and `/agents/:agentId`
- wire `/tasks` and `/tasks/:taskId`
- wire `/workflows` and `/workflows/:workflowId`
- add consistent filters, empty states, and entity linking

### Phase C — live updates
- subscribe shell to `/api/v1/live`
- update overview counters, status badges, and command states
- add stale/disconnected treatment

### Phase D — operator actions
- add command confirmation dialogs
- submit restart/retry/rerun/cancel/start/stop flows
- add commands list/history feedback

### Phase E — extension screens
- alerts
- infrastructure
- costs
- audit

---

## 17. Definition of done for MVP frontend shell

The shell is MVP-ready when an operator can:
- land on Overview and understand platform health quickly,
- navigate between agents, tasks, and workflows without losing context,
- inspect detail views with events/logs/dependencies/graph at a practical level,
- perform the core approved actions safely with reason capture,
- see command status and live updates,
- understand when data is stale, incomplete, or forbidden by role.

If those outcomes are met, the frontend shell is doing its job even if design polish remains basic.

---

## 18. Recommended non-goals for the first UI cut

Do **not** let the first shell get slowed down by:
- custom graph editing,
- advanced dashboard personalization,
- dense multi-pane power-user layouts,
- offline support,
- full-text global search across all entities,
- design-system perfection,
- optimistic command orchestration beyond clear pending state.

Mission Control MVP should feel trustworthy, navigable, and operational — not necessarily fancy.
