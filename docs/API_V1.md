# MISSION_CONTROL_API_V1.md

## Formål
Definere API v1 for Mission Control Center.

API’et skal understøtte:
- read-models til UI
- realtime-operativ styring
- sikker command execution
- observability lookup
- cost og governance visninger

---

## API-principper
- REST til hovedparten af query- og command-initiering
- WebSocket eller SSE til live updates
- RBAC håndhæves server-side
- Alle write/control endpoints er audit-pligtige
- Tunge datafiltre og søgninger skal være paginerede

Base path forslag:
`/api/v1`

---

## 1. Authentication & session

### `GET /api/v1/me`
Returnerer den aktuelle bruger og rolle.

**Response**
```json
{
  "id": "uuid",
  "email": "ops@example.com",
  "displayName": "Ops Admin",
  "role": "admin"
}
```

---

## 2. Overview

### `GET /api/v1/overview`
Returnerer aggregate operational summary til Overview-siden.

**Response**
```json
{
  "agents": {
    "total": 5,
    "idle": 1,
    "working": 3,
    "failed": 1,
    "degraded": 0
  },
  "tasks": {
    "pending": 12,
    "running": 8,
    "failed24h": 5
  },
  "workflows": {
    "running": 4,
    "failed24h": 2
  },
  "cost": {
    "currentBurnRateUsdPerHour": 3.25,
    "todayUsd": 41.80
  },
  "infra": {
    "status": "healthy"
  },
  "alerts": {
    "open": 3,
    "critical": 1
  },
  "providers": [
    { "name": "openai", "status": "healthy" }
  ],
  "generatedAt": "2026-01-01T12:00:00Z"
}
```

---

## 3. Agents

### `GET /api/v1/agents`
Lister agenter.

**Query params**
- `status`
- `type`
- `search`
- `page`
- `pageSize`
- `sort`

### `GET /api/v1/agents/:agentId`
Returnerer agentdetaljer.

### `GET /api/v1/agents/:agentId/events`
Returnerer events for agenten.

### `GET /api/v1/agents/:agentId/logs`
Returnerer logs for agenten.

### `GET /api/v1/agents/:agentId/metrics`
Returnerer metrics snapshots / aggregater.

### `POST /api/v1/agents/:agentId/commands/restart`
### `POST /api/v1/agents/:agentId/commands/start`
### `POST /api/v1/agents/:agentId/commands/stop`
### `POST /api/v1/agents/:agentId/commands/drain`

**Request**
```json
{
  "reason": "Agent is stuck on stale heartbeat"
}
```

**Response**
```json
{
  "commandId": "uuid",
  "status": "pending"
}
```

### `POST /api/v1/agent-pools/:type/commands/scale`
Admin-only.

**Request**
```json
{
  "desiredCount": 4,
  "reason": "Increase throughput for peak load"
}
```

---

## 4. Tasks

### `GET /api/v1/tasks`
Lister tasks.

**Query params**
- `status`
- `priority`
- `agentId`
- `workflowId`
- `page`
- `pageSize`
- `sort`

### `GET /api/v1/tasks/:taskId`
Taskdetalje.

### `GET /api/v1/tasks/:taskId/dependencies`
Returnerer upstream/downstream dependencies.

### `GET /api/v1/tasks/:taskId/events`
### `GET /api/v1/tasks/:taskId/logs`
### `GET /api/v1/tasks/:taskId/costs`

### `POST /api/v1/tasks/:taskId/commands/retry`
### `POST /api/v1/tasks/:taskId/commands/cancel`
### `POST /api/v1/tasks/:taskId/commands/reassign`

**Reassign request**
```json
{
  "agentId": "uuid",
  "reason": "Move task to healthy agent"
}
```

---

## 5. Workflows

### `GET /api/v1/workflows`
Lister workflows.

**Query params**
- `status`
- `triggerType`
- `initiatedBy`
- `page`
- `pageSize`

### `GET /api/v1/workflows/:workflowId`
Workflowdetalje.

### `GET /api/v1/workflows/:workflowId/graph`
Returnerer workflow graph/DAG data til UI.

### `GET /api/v1/workflows/:workflowId/events`
### `GET /api/v1/workflows/:workflowId/tasks`
### `GET /api/v1/workflows/:workflowId/costs`

### `POST /api/v1/workflows/:workflowId/commands/rerun`
### `POST /api/v1/workflows/:workflowId/commands/pause`
### `POST /api/v1/workflows/:workflowId/commands/resume`
### `POST /api/v1/workflows/:workflowId/commands/cancel`

---

## 6. Observability

### `GET /api/v1/events`
Global events query.

**Query params**
- `sourceType`
- `severity`
- `agentId`
- `taskId`
- `workflowId`
- `correlationId`
- `from`
- `to`
- `page`
- `pageSize`

### `GET /api/v1/logs`
Global structured logs query.

**Query params**
- `level`
- `service`
- `agentId`
- `taskId`
- `workflowId`
- `traceId`
- `from`
- `to`
- `page`
- `pageSize`
- `q`

### `GET /api/v1/metrics/agents`
Agent metrics aggregates.

### `GET /api/v1/metrics/system`
System-level metrics aggregates.

### `GET /api/v1/correlations/:correlationId`
Returnerer samlet relation mellem task/workflow/agent/events/logs/commands.

---

## 7. Cost & usage

### `GET /api/v1/costs/summary`
Returnerer top-level spend.

### `GET /api/v1/costs/by-agent`
### `GET /api/v1/costs/by-workflow`
### `GET /api/v1/costs/by-provider`
### `GET /api/v1/costs/timeseries`

**Query params**
- `from`
- `to`
- `groupBy=hour|day|week`
- `agentId`
- `workflowId`
- `provider`
- `model`

---

## 8. Infrastructure

### `GET /api/v1/infrastructure/summary`
CPU, RAM, disk, queue, DB, provider health.

### `GET /api/v1/infrastructure/services`
Lister containers/services og deres status.

### `GET /api/v1/infrastructure/providers`
Eksterne providers og health state.

### `GET /api/v1/infrastructure/metrics`
Infra metrics timeseries.

---

## 9. Alerts / incidents

### `GET /api/v1/alerts`
Lister alerts.

**Query params**
- `status`
- `severity`
- `type`
- `agentId`
- `taskId`
- `workflowId`
- `page`
- `pageSize`

### `GET /api/v1/alerts/:alertId`
Alertdetalje.

### `POST /api/v1/alerts/:alertId/acknowledge`
### `POST /api/v1/alerts/:alertId/resolve`
### `POST /api/v1/alerts/:alertId/suppress`

**Request**
```json
{
  "reason": "Known transient provider issue"
}
```

---

## 10. Commands

### `GET /api/v1/commands`
Lister control commands.

### `GET /api/v1/commands/:commandId`
Returnerer commanddetalje og status.

### `POST /api/v1/commands/:commandId/approve`
Til commands med approval flow.

### `POST /api/v1/commands/:commandId/cancel`
Annullerer command før execution hvis muligt.

---

## 11. Governance & security

### `GET /api/v1/audit-logs`
Filterbar auditlog.

**Query params**
- `actorId`
- `targetType`
- `targetId`
- `action`
- `result`
- `from`
- `to`
- `page`
- `pageSize`

### `GET /api/v1/users`
Admin-only liste over brugere/roller.

### `PATCH /api/v1/users/:userId/role`
Admin-only.

### `GET /api/v1/api-keys`
Alias-baseret key inventory.

### `POST /api/v1/api-keys/:keyId/commands/rotate`
Admin-only følsom handling.

---

## 12. Live updates

## Option A — WebSocket
### `GET /api/v1/live`
Sender events som:
- `agent.updated`
- `task.updated`
- `workflow.updated`
- `alert.created`
- `alert.updated`
- `command.updated`
- `provider.updated`
- `overview.updated`

## Example payload
```json
{
  "type": "task.updated",
  "ts": "2026-01-01T12:05:00Z",
  "data": {
    "taskId": "uuid",
    "status": "failed",
    "workflowId": "uuid"
  }
}
```

---

## 13. Error model

Alle fejl bør returnere struktureret:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "User does not have permission to restart agent",
    "details": {}
  }
}
```

Foreslåede fejlkoder:
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `VALIDATION_ERROR`
- `CONFLICT`
- `COMMAND_REJECTED`
- `RATE_LIMITED`
- `INTERNAL_ERROR`

---

## 14. RBAC minimum matrix

### Viewer
- GET endpoints for overview, agents, tasks, workflows, observability, costs, infra, alerts
- ingen commands

### Operator
- viewer permissions
- acknowledge/resolve alerts
- retry/cancel task
- restart/start/stop/drain agent
- rerun/pause/resume workflows

### Admin
- operator permissions
- scale agents
- role changes
- API key rotate
- sensitive governance actions

### Auditor
- read access til audit, alerts, observability, governance views
- ingen runtime commands

---

## 15. Recommended DTO grouping
- `AgentSummaryDTO`
- `AgentDetailDTO`
- `TaskSummaryDTO`
- `TaskDetailDTO`
- `WorkflowSummaryDTO`
- `WorkflowDetailDTO`
- `AlertDTO`
- `CommandDTO`
- `OverviewDTO`
- `CostSummaryDTO`
- `InfrastructureSummaryDTO`

---

## 16. Næste skridt
1. Konverter API spec til OpenAPI
2. Definér DTO schemas i TypeScript
3. Implementér read APIs før command APIs
4. Tilføj live transport og subscription model
