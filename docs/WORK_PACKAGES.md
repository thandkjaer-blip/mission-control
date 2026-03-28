# WORK PACKAGES — MVP Execution Plan

This document turns the current Mission Control design pack into an implementation-oriented MVP delivery plan. It is based on:

- `docs/ARCHITECTURE.md`
- `docs/API_V1.md`
- `docs/DB_SCHEMA_V1.md`
- `backlog/MVP_BACKLOG.md`

The goal is to sequence work so the team can deliver a usable control plane early, while keeping observability, auditability, and runtime safety built in from the start.

---

## Planning assumptions

- MVP targets a single Mission Control deployment for OpenClaw, not multi-tenant SaaS.
- PostgreSQL is the source of truth for operational state and audit data.
- Metrics/logs may eventually live in dedicated backends, but MVP should still expose a coherent read model through the Mission Control API.
- Read APIs should land before mutating command APIs wherever practical.
- Real-time updates should support overview, agent/task/workflow state, alerts, and command status.
- Commands must always flow through authorization, audit, async dispatch, and result tracking.

---

## Recommended execution order

1. **WP1 — Platform foundation and repo scaffolding**
2. **WP2 — Data model, migrations, and seed data**
3. **WP3 — Runtime contracts and ingestion pipeline**
4. **WP4 — Core read API and query layer**
5. **WP5 — Real-time update transport**
6. **WP6 — Overview, agents, tasks, and workflows UI**
7. **WP7 — Command pipeline and operator actions**
8. **WP8 — Alerts and incident response surfaces**
9. **WP9 — Cost and usage tracking**
10. **WP10 — Infrastructure health monitoring**
11. **WP11 — Governance, RBAC, and audit views**
12. **WP12 — Hardening, test coverage, and MVP release readiness**

This order deliberately gets the system observable and queryable before adding broad operator control, so the control plane does not become a blind command console.

---

## WP1 — Platform foundation and repo scaffolding

### Goal
Stand up the implementation skeleton for backend, frontend, shared types, local dev tooling, and deployment basics.

### Scope
- Choose the concrete MVP stack from the architecture proposal:
  - frontend framework
  - backend framework
  - ORM/query layer
  - migration tooling
  - real-time transport choice (WebSocket vs SSE)
- Create repo structure for:
  - `apps/api`
  - `apps/web`
  - `packages/shared` or equivalent shared contracts/types
  - `infra/` or `docker/` for local environment
- Add local development setup for Postgres and any queue/bus dependency.
- Add linting, formatting, test runners, env handling, and CI baseline.
- Establish baseline health endpoints and app bootstraps.

### Out of scope
- Full feature implementation
- Production-grade autoscaling or Kubernetes rollout
- Advanced observability stack deployment beyond what is needed for development

### Dependencies
- None

### Deliverables
- Running API app and web app skeletons
- Shared package for DTOs/contracts/constants
- Local dev environment via Docker Compose or equivalent
- CI pipeline running lint/test/build
- Initial README setup instructions

### Notes
Keep this package small. The point is to unblock implementation, not to overdesign the workspace.

---

## WP2 — Data model, migrations, and seed data

### Goal
Turn `DB_SCHEMA_V1` into executable database migrations and authoritative persistence primitives.

### Scope
- Implement PostgreSQL enums and tables from `docs/DB_SCHEMA_V1.md`.
- Add `updated_at` trigger/app-layer update strategy.
- Define ORM models or query repositories.
- Seed base roles and at least one admin/operator/viewer/auditor test user.
- Add indexes from schema spec.
- Decide which fields are authoritative runtime writes vs derived rollups.
- Add migration smoke tests and local reset scripts.

### Out of scope
- Long-term partitioning/retention implementation
- Advanced analytics models

### Dependencies
- WP1

### Deliverables
- Executable migrations
- Seed scripts
- Database access layer/repositories
- Short schema notes documenting derived vs source-of-truth fields

### Notes
This work package is the foundation for every query, command, alert, and audit feature. Do not move ahead with broad API work until the schema is stable enough for iteration.

---

## WP3 — Runtime contracts and ingestion pipeline

### Goal
Define and implement how agents/services write state, events, logs, metrics, cost records, and provider health into Mission Control.

### Scope
- Define MVP payload schemas for:
  - agent heartbeats/state updates
  - task state transitions
  - workflow state transitions
  - events
  - structured logs
  - metrics snapshots
  - cost records
  - provider health snapshots
- Implement ingestion endpoints or internal consumers for those payloads.
- Add validation and correlation ID handling.
- Implement rollup/update logic for:
  - `agents.current_task_id`
  - workflow counts/cost totals
  - task assignment/state updates
- Establish stale heartbeat policy and degraded/failed mapping.
- Add idempotency rules where duplicate events are likely.

### Out of scope
- Full OpenTelemetry collector integration if it slows MVP
- Advanced trace viewer

### Dependencies
- WP2

### Deliverables
- Shared telemetry/event schemas
- Ingestion handlers and persistence logic
- Reconciliation rules for core runtime state
- Test fixtures that simulate agent/task/workflow activity

### Notes
This is where the architecture becomes real. If telemetry contracts are weak, the entire product becomes unreliable.

---

## WP4 — Core read API and query layer

### Goal
Expose stable API v1 read models for overview, agents, tasks, workflows, observability, costs, infrastructure, alerts, commands, and governance.

### Scope
- Implement `GET` endpoints from `docs/API_V1.md` first, with pagination/filter/sort support where specified.
- Build query services and DTO mappers for:
  - overview
  - agents + details/events/logs/metrics
  - tasks + details/dependencies/events/logs/costs
  - workflows + details/graph/events/tasks/costs
  - events/logs/metrics/correlations
  - costs summary and breakdowns
  - infrastructure summary/services/providers/metrics
  - alerts
  - commands
  - audit logs/users/api keys
- Add consistent error model.
- Add authn stub/basic session resolution and role gates for read endpoints.
- Generate or begin an OpenAPI document from implementation.

### Out of scope
- Command execution endpoints
- Rich frontend UI beyond basic verification

### Dependencies
- WP2, WP3

### Deliverables
- Working read-side API v1
- DTO definitions aligned with spec
- Basic API documentation/OpenAPI draft
- Integration tests for key filters and detail endpoints

### Notes
This package should produce a browsable, testable control-plane backend even before the main UI exists.

---

## WP5 — Real-time update transport

### Goal
Provide live state updates to the UI for the core operational surfaces.

### Scope
- Implement `/api/v1/live` transport using the selected approach.
- Publish/update event types at minimum:
  - `agent.updated`
  - `task.updated`
  - `workflow.updated`
  - `alert.created`
  - `alert.updated`
  - `command.updated`
  - `provider.updated`
  - `overview.updated`
- Define subscription/auth behavior.
- Add a server-side fanout layer tied to state changes from ingestion and commands.
- Add reconnect/backfill strategy for the web client.

### Out of scope
- Fine-grained per-widget subscriptions unless needed
- Complex replay/history protocol

### Dependencies
- WP3, WP4

### Deliverables
- Live update endpoint
- Shared live event contract/types
- Backend tests for event publication
- Frontend client utility for consuming live updates

### Notes
Near-real-time is enough for MVP. Reliable and simple beats clever here.

---

## WP6 — Overview, agents, tasks, and workflows UI

### Goal
Deliver the core operator interface for seeing system state and navigating from summary to detail.

### Scope
- Build MVP pages/views for:
  - overview dashboard
  - agents list + agent detail
  - tasks list + task detail
  - workflows list + workflow detail
- Include filters, status badges, current task/ownership, heartbeat freshness, and key summary metrics.
- Implement a simple dependency/DAG visualization sufficient for blocked-task diagnosis.
- Wire pages to read APIs and live updates.
- Add links across entities: agent ↔ task ↔ workflow.

### Out of scope
- Pixel-perfect design system polish
- Advanced graph editing or workflow authoring

### Dependencies
- WP4, WP5

### Deliverables
- Functional core MVP web UI for overview/agents/tasks/workflows
- Entity drill-down flow for operational debugging
- Basic loading/error/empty states

### Notes
This is the first point where Mission Control becomes genuinely usable by operators.

---

## WP7 — Command pipeline and operator actions

### Goal
Implement safe control actions through the audited command pipeline described in the architecture.

### Scope
- Implement command creation/status tracking using `control_commands`.
- Implement authorization, policy check hooks, audit log writes, async execution, and result events.
- Support MVP commands:
  - agent restart
  - agent start
  - agent stop
  - task retry
  - task cancel
  - workflow rerun
  - workflow pause/resume if feasible within MVP
- Implement admin-only scale command if runtime support exists; otherwise leave scaffolded but feature-flagged.
- Expose command status/history views and UI feedback.
- Add confirmation/reason capture for sensitive actions.

### Out of scope
- Dual-approval flows for all commands
- Broad automation/remediation engine

### Dependencies
- WP3, WP4, WP5, WP6

### Deliverables
- Working command endpoints and executor pipeline
- Audit entries for all command attempts/results
- UI action flows with pending/executing/succeeded/failed state
- Failure paths and operator-visible error messages

### Notes
No direct runtime mutation shortcuts. If an action is not audited and observable, it is not done correctly.

---

## WP8 — Alerts and incident response surfaces

### Goal
Surface the most important failures quickly and make them actionable.

### Scope
- Implement alert generation for MVP alert types:
  - `task_failed`
  - `agent_stuck`
  - `cost_spike`
  - `api_failure`
  - `infra_degraded`
- Implement alert lifecycle actions:
  - acknowledge
  - resolve
  - suppress
- Build alerts list and detail UI.
- Link alerts to source agent/task/workflow/command context.
- Add incident timeline view from related events/logs where possible.
- Add runbook URL support.

### Out of scope
- Advanced dedupe/grouping heuristics beyond basic sane behavior
- Predictive anomaly detection

### Dependencies
- WP3, WP4, WP5, WP6, WP7

### Deliverables
- Alert evaluation logic for MVP cases
- Alert APIs and UI views
- Alert-to-entity navigation and action flow
- Basic incident timeline/context panel

### Notes
Alerts should be few, clear, and actionable. Noise will kill adoption fast.

---

## WP9 — Cost and usage tracking

### Goal
Give operators and admins enough visibility into spend to catch regressions and spikes.

### Scope
- Persist and expose `cost_records` and rollups.
- Implement API endpoints for:
  - summary
  - by-agent
  - by-workflow
  - by-provider
  - timeseries
- Show burn rate, top cost drivers, and token usage.
- Wire cost spike alerting thresholds into alert generation.
- Add UI views/cards for cost on overview and dedicated cost screens.

### Out of scope
- Forecasting or budget automation
- Deep finance export/reporting

### Dependencies
- WP3, WP4, WP5, WP6, WP8

### Deliverables
- Cost aggregation/query layer
- Cost UI views
- Burn-rate and spike detection logic
- Correlation from cost record to workflow/task/agent where available

### Notes
MVP cost tracking can be near-real-time. The important part is trustworthy attribution, not perfect dashboards.

---

## WP10 — Infrastructure health monitoring

### Goal
Expose the health of the Mission Control platform and key providers in one operator view.

### Scope
- Implement infrastructure summary/services/providers/metrics APIs.
- Ingest and display:
  - CPU
  - RAM
  - disk
  - service/container status
  - DB health
  - queue health
  - provider health/latency/error rate
- Add overview badges and dedicated infrastructure page.
- Feed critical infra degradations into alert creation.

### Out of scope
- Full cluster management
- Deep node-level diagnostics beyond MVP summary needs

### Dependencies
- WP3, WP4, WP5, WP6, WP8

### Deliverables
- Infrastructure read models and APIs
- Infra UI panels/views
- Provider health indicators
- Infra-derived alert triggers for critical conditions

### Notes
Keep the first version operational: answer “what is unhealthy?” and “where do I click next?”

---

## WP11 — Governance, RBAC, and audit views

### Goal
Make access control and operator actions traceable enough for real production use.

### Scope
- Implement backend RBAC for viewer/operator/admin/auditor.
- Gate all command and sensitive endpoints server-side.
- Implement audit log generation for commands and important governance actions.
- Implement governance read APIs:
  - audit logs
  - users
  - role change
  - API key inventory
- Build basic UI for audit log inspection and role-aware access control behavior.
- Ensure API key inventory never exposes secrets in plaintext.

### Out of scope
- Full policy engine
- SSO/enterprise IAM integrations unless required by current stack

### Dependencies
- WP4, WP7

### Deliverables
- RBAC enforcement matrix in code
- Audit log read view and filters
- Basic users/roles admin path
- API key inventory surface

### Notes
This package can overlap with other work, but it must be complete before MVP is called production-ready.

---

## WP12 — Hardening, test coverage, and MVP release readiness

### Goal
Close the gap between “feature-complete demo” and “something operators can trust in production.”

### Scope
- End-to-end test coverage for core flows:
  - live overview updates
  - drill-down from alert/task/workflow/agent
  - retry/cancel/restart command lifecycle
  - audit log creation
  - RBAC denial paths
- Failure-mode testing for stale heartbeats, failed commands, provider degradation, and DB/query edge cases.
- Performance checks for list endpoints, live updates, and main dashboard.
- Seed/demo data and operator runbook notes.
- MVP release checklist and deployment notes.
- Bug bash and polish for top operational workflows.

### Out of scope
- Phase-2 features
- Large-scale multi-region readiness

### Dependencies
- WP1–WP11

### Deliverables
- Release checklist
- End-to-end and integration test coverage for critical flows
- Performance and operational acceptance notes
- MVP deployment/runbook documentation

### Notes
Do not skip this package. Mission Control is an ops product; reliability is part of the feature set.

---

## Parallelization guidance

Some packages can overlap once foundations are in place:

- **Can run mostly in parallel after WP2/WP3:** WP4 and portions of WP11
- **Can run in parallel after WP4/WP5:** WP6 and early parts of WP8/WP9/WP10
- **Should stay tightly coordinated:** WP7 and WP11, because command authorization/audit boundaries must match
- **Should not be deferred too long:** WP12 test/hardening work; start adding it incrementally before the end

Recommended team split once foundations are ready:

- **Backend track:** WP3, WP4, WP7, WP8, WP9, WP10, WP11
- **Frontend track:** WP5 client work, WP6, UI parts of WP8/WP9/WP10/WP11
- **Platform/QA track:** WP1, WP2 support, WP12

---

## MVP cutline by package

### Required for MVP
- WP1 through WP8 fully completed
- WP9 completed at least to trustworthy summary/by-agent/by-workflow/provider views and spike alerting
- WP10 completed at least to summary/provider/service health level
- WP11 completed at least to backend RBAC, audit logs, and role-aware UI behavior
- WP12 completed for critical-path flows

### Can be simplified but not omitted
- Workflow graph can be simple, read-only, and diagnostic-first
- Infrastructure page can start with summary + provider/service health before deeper charts
- API key inventory can be metadata-only in MVP
- Approval flows can be minimal and targeted to sensitive actions

### Explicitly phase 2+
- Predictive anomaly detection
- Automatic remediation
- Multi-tenant support
- Simulation/replay
- Advanced trace explorer
- Advanced DAG editor

---

## First three implementation sprints

### Sprint 1
- WP1 complete
- WP2 complete
- WP3 started with heartbeats, task/workflow state, events, and logs

### Sprint 2
- WP3 complete for MVP contracts
- WP4 complete for overview/agents/tasks/workflows/alerts/commands reads
- WP5 complete
- WP6 started

### Sprint 3
- WP6 complete
- WP7 complete for restart/retry/cancel/rerun
- WP8 complete for failed task and stuck agent alerts
- WP11 core RBAC/audit enforcement in place

After that, close WP9/WP10 and then push through WP12 hardening to release.

---

## Definition of done for this plan

This work-package plan is successful if a delivery lead can:
- assign ownership package by package,
- understand what has to exist before later work starts,
- distinguish MVP-critical work from phase-2 ideas,
- and move directly from docs into implementation tickets.
