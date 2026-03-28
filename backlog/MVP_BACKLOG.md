# MISSION_CONTROL_MVP_BACKLOG.md

## Produktmål
Byg et production-ready Mission Control Center for OpenClaw, der giver real-time overblik og sikker operativ kontrol over agenter, tasks, workflows, omkostninger, observability og infrastruktur.

---

## MVP-principper
- Real-time driftsoverblik
- Hurtig incident response
- Auditérbar command layer
- Production-minded observability
- Klar afgrænsning: MVP før avanceret automation

---

## Primære brugerroller
- **Admin** — fuld kontrol og governance
- **Operator** — drift, retry, restart, incident-håndtering
- **Viewer** — read-only indblik i status og historik
- **Auditor** — audit, sikkerhed og sporbarhed

---

## Epics

## Epic 1 — Agent Management
**Mål:** Operatøren kan se og styre alle agenter.

### User stories
1. Som operator vil jeg se alle agenter i en liste med status, så jeg hurtigt kan se, hvem der er idle, arbejder eller fejler.
2. Som operator vil jeg se heartbeat, current task, success rate og fejlstatus per agent, så jeg kan vurdere driftstilstand.
3. Som admin vil jeg kunne starte, stoppe og restarte en agent, så jeg kan genskabe drift hurtigt.
4. Som operator vil jeg kunne åbne agentdetaljer med logs, metrics og nylige events, så jeg kan fejlfinde.

### Acceptance criteria
- Agentliste opdateres live eller nær real-time
- Status understøtter mindst: idle, working, failed, stopped, degraded
- Restart/stop/start går gennem auditérbar command pipeline
- Agentdetalje viser logs, metrics og seneste events

---

## Epic 2 — Task Orchestration
**Mål:** Operatøren kan se og styre task-kø og workflows.

### User stories
1. Som operator vil jeg se tasks fordelt på pending, running, completed og failed.
2. Som operator vil jeg se task dependencies, så jeg forstår hvorfor noget er blokeret.
3. Som operator vil jeg kunne retry’e en failed task.
4. Som operator vil jeg kunne cancel en task eller rerun et workflow.
5. Som operator vil jeg kunne se hvilket agent der ejer en task lige nu.

### Acceptance criteria
- Taskliste kan filtreres på status, agent, workflow og prioritet
- Workflowdetalje viser afhængigheder i mindst en simpel DAG eller dependency-visning
- Retry/cancel/rerun er tilgængelige som commands med auditlog
- Blokerede tasks viser årsag tydeligt

---

## Epic 3 — Observability
**Mål:** Platformen er observerbar nok til drift og root cause analysis.

### User stories
1. Som operator vil jeg se metrics for throughput, latency, success rate og queue depth.
2. Som operator vil jeg se strukturerede logs per agent/task/workflow.
3. Som operator vil jeg se en event timeline, så jeg kan forstå hændelsesforløb.
4. Som admin vil jeg kunne korrelere logs, events og tasks via IDs.

### Acceptance criteria
- Metrics-view viser mindst task rate, failure rate, queue depth, heartbeat lag og avg latency
- Logs kan søges og filtreres på agentId, taskId, workflowId og level
- Event timeline viser tidslinje med severity og korrelation
- Klik fra failed task til relaterede logs/events understøttes

---

## Epic 4 — Cost & Usage Tracking
**Mål:** Driftsteamet kan se forbrug og reagere på cost spikes.

### User stories
1. Som operator vil jeg se tokenforbrug per agent.
2. Som admin vil jeg se cost per workflow.
3. Som operator vil jeg se burn rate per time og alarmer ved spikes.
4. Som admin vil jeg kunne se forbrug fordelt på provider/model.

### Acceptance criteria
- Cost-side viser agent-, workflow- og provider-fordeling
- Real-time eller near-real-time burn rate vises
- Cost spike alerts kan udløses
- Token usage og cost records er koblet til agent/task/workflow når muligt

---

## Epic 5 — Infrastructure Monitoring
**Mål:** Mission Control viser driftstilstanden for den underliggende platform.

### User stories
1. Som operator vil jeg se CPU, RAM og disk for platformen.
2. Som operator vil jeg se container/service status.
3. Som operator vil jeg se helbred på OpenAI og eksterne APIs.
4. Som admin vil jeg se queue-lag, DB-latency og centrale runtime-signaler.

### Acceptance criteria
- Infra-view viser CPU, memory, disk og service health
- Eksterne providers har health badges: healthy/degraded/down
- Køsystem og database har basale health metrics
- Kritiske fejl slår ud i alerts

---

## Epic 6 — Alerts & Incident Response
**Mål:** Platformen kan alarmere og støtte hurtig handling.

### User stories
1. Som operator vil jeg se failed tasks og stuck agents som alerts.
2. Som operator vil jeg kunne acknowledge og resolve alerts.
3. Som operator vil jeg kunne gå direkte fra alert til relevant task/agent/workflow.
4. Som admin vil jeg kunne se incident timeline.

### Acceptance criteria
- Alerts kan være open, acknowledged, resolved
- Alerts linker til kildeobjekt og relaterede data
- Mindst disse alerttyper understøttes: task_failed, agent_stuck, cost_spike, api_failure, infra_degraded
- Alertdetalje viser anbefalet handling eller runbook-link

---

## Epic 7 — Security & Governance
**Mål:** Alle kontrolhandlinger og adgange er sporbare og styrede.

### User stories
1. Som admin vil jeg have RBAC mellem admin, operator, viewer og auditor.
2. Som auditor vil jeg kunne se audit logs for commands og vigtige state changes.
3. Som admin vil jeg se API key inventory med alias og status.
4. Som admin vil jeg sikre, at følsomme handlinger kræver bekræftelse.

### Acceptance criteria
- RBAC håndhæves på backend
- Alle commands skriver auditlog med actor, target og resultat
- API keys vises aldrig i klartekst
- Følsomme commands kræver confirmation/reason

---

## Epic 8 — Command Layer
**Mål:** Operatøren kan handle sikkert fra Mission Control.

### User stories
1. Som operator vil jeg kunne restart agent.
2. Som operator vil jeg kunne cancel task.
3. Som operator vil jeg kunne retry task.
4. Som operator vil jeg kunne rerun workflow.
5. Som admin vil jeg kunne scale agents.

### Acceptance criteria
- Commands går gennem authorization + audit + async execution
- Command-status vises som pending/executing/succeeded/failed
- UI viser outcome og fejl, hvis command fejler
- Scale-agent command kan begrænses til admin

---

## MVP scope cutline
### Inkluder i MVP
- Agentliste + agentdetalje
- Taskliste + taskdetalje
- Workflowliste + simpel dependency-view
- Metrics, logs, event timeline
- Cost tracking per agent/workflow/provider
- Infra health panel
- Alerts view
- RBAC basic
- Audit logs basic
- Commands: restart agent, cancel task, retry task, rerun workflow

### Udsæt til fase 2+
- Avanceret trace explorer
- Predictive anomaly detection
- Automatisk remediation
- Multi-tenant support
- Policy engine
- Simulation/replay mode
- Dual-approval flows på alt
- Avanceret DAG editor

---

## Prioriteret implementeringsrækkefølge
1. Core data model + telemetry contract
2. Control plane backend APIs
3. Event/log/metrics ingestion
4. Agent/task/workflow views
5. Alerts + command layer
6. Cost tracking
7. Infra monitoring
8. Governance hardening

---

## Definition of Done for MVP
MVP er færdig når:
- driftsteamet kan se alle aktive agenter og workflows i realtid
- failed tasks og stuck agents udløser synlige alerts
- en operator kan retry’e/cancel’e/restarte via UI
- logs/events/metrics kan bruges til root cause analysis
- costs kan spores per agent og workflow
- alle commands er auditérbare
