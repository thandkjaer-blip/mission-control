-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('programmer', 'uiux', 'po', 'graphic', 'infra');

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('idle', 'working', 'failed', 'stopped', 'degraded', 'starting');

-- CreateEnum
CREATE TYPE "HealthStatus" AS ENUM ('healthy', 'warning', 'critical');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('pending', 'queued', 'running', 'completed', 'failed', 'cancelled', 'blocked', 'retrying');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled', 'partial');

-- CreateEnum
CREATE TYPE "TriggerType" AS ENUM ('manual', 'schedule', 'event', 'api');

-- CreateEnum
CREATE TYPE "PriorityLevel" AS ENUM ('low', 'normal', 'high', 'critical');

-- CreateEnum
CREATE TYPE "DependencyType" AS ENUM ('hard', 'soft');

-- CreateEnum
CREATE TYPE "EventSeverity" AS ENUM ('info', 'warning', 'error', 'critical');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('debug', 'info', 'warn', 'error');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('task_failed', 'agent_stuck', 'cost_spike', 'api_failure', 'infra_degraded', 'security_event');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('warning', 'critical');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('open', 'acknowledged', 'resolved', 'suppressed');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('user', 'system');

-- CreateEnum
CREATE TYPE "CommandStatus" AS ENUM ('pending', 'approved', 'executing', 'succeeded', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "KeyStatus" AS ENUM ('active', 'rotating', 'revoked', 'error');

-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('admin', 'operator', 'viewer', 'auditor');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "role" "RoleType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AgentType" NOT NULL,
    "version" TEXT NOT NULL,
    "status" "AgentStatus" NOT NULL DEFAULT 'starting',
    "health" "HealthStatus" NOT NULL DEFAULT 'healthy',
    "current_task_id" UUID,
    "worker_id" TEXT,
    "last_heartbeat_at" TIMESTAMPTZ(6),
    "started_at" TIMESTAMPTZ(6),
    "restart_count" INTEGER NOT NULL DEFAULT 0,
    "success_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "avg_task_duration_ms" BIGINT NOT NULL DEFAULT 0,
    "total_tasks_completed" BIGINT NOT NULL DEFAULT 0,
    "token_usage_total" BIGINT NOT NULL DEFAULT 0,
    "cost_total_usd" DECIMAL(14,6) NOT NULL DEFAULT 0,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflows" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'pending',
    "trigger_type" "TriggerType" NOT NULL,
    "initiated_by" TEXT NOT NULL,
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "total_tasks" INTEGER NOT NULL DEFAULT 0,
    "completed_tasks" INTEGER NOT NULL DEFAULT 0,
    "failed_tasks" INTEGER NOT NULL DEFAULT 0,
    "total_cost_usd" DECIMAL(14,6) NOT NULL DEFAULT 0,
    "total_tokens" BIGINT NOT NULL DEFAULT 0,
    "sla_class" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "workflow_id" UUID,
    "parent_task_id" UUID,
    "assigned_agent_id" UUID,
    "type" TEXT NOT NULL,
    "priority" "PriorityLevel" NOT NULL DEFAULT 'normal',
    "status" "TaskStatus" NOT NULL DEFAULT 'pending',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "input" JSONB NOT NULL DEFAULT '{}',
    "output" JSONB,
    "error" JSONB,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "created_by" TEXT NOT NULL,
    "due_at" TIMESTAMPTZ(6),
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_task_dependencies" (
    "task_id" UUID NOT NULL,
    "depends_on_task_id" UUID NOT NULL,
    "dependency_type" "DependencyType" NOT NULL DEFAULT 'hard',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_task_dependencies_pkey" PRIMARY KEY ("task_id","depends_on_task_id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "severity" "EventSeverity" NOT NULL DEFAULT 'info',
    "ts" TIMESTAMPTZ(6) NOT NULL,
    "correlation_id" TEXT,
    "trace_id" TEXT,
    "workflow_id" UUID,
    "task_id" UUID,
    "agent_id" UUID,
    "message" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "structured_logs" (
    "id" UUID NOT NULL,
    "ts" TIMESTAMPTZ(6) NOT NULL,
    "level" "LogLevel" NOT NULL,
    "service" TEXT NOT NULL,
    "agent_id" UUID,
    "workflow_id" UUID,
    "task_id" UUID,
    "trace_id" TEXT,
    "span_id" TEXT,
    "message" TEXT NOT NULL,
    "context" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "structured_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_metric_snapshots" (
    "id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "ts" TIMESTAMPTZ(6) NOT NULL,
    "cpu_pct" DECIMAL(5,2),
    "memory_mb" DECIMAL(12,2),
    "tokens_per_min" DECIMAL(12,2),
    "requests_per_min" DECIMAL(12,2),
    "avg_latency_ms" DECIMAL(12,2),
    "success_rate_window" DECIMAL(5,2),
    "queue_depth" INTEGER,
    "active_tasks" INTEGER,
    "cost_per_hour_usd" DECIMAL(12,6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_metric_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_records" (
    "id" UUID NOT NULL,
    "ts" TIMESTAMPTZ(6) NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "agent_id" UUID,
    "workflow_id" UUID,
    "task_id" UUID,
    "prompt_tokens" BIGINT NOT NULL DEFAULT 0,
    "completion_tokens" BIGINT NOT NULL DEFAULT 0,
    "total_tokens" BIGINT NOT NULL DEFAULT 0,
    "cost_usd" DECIMAL(14,6) NOT NULL DEFAULT 0,
    "request_count" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_health_snapshots" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "latency_ms" DECIMAL(12,2),
    "error_rate" DECIMAL(6,3),
    "details" JSONB NOT NULL DEFAULT '{}',
    "ts" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_health_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" UUID NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'open',
    "source_id" TEXT,
    "source_type" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "triggered_at" TIMESTAMPTZ(6) NOT NULL,
    "acknowledged_by" TEXT,
    "acknowledged_at" TIMESTAMPTZ(6),
    "resolved_at" TIMESTAMPTZ(6),
    "runbook_url" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "workflow_id" UUID,
    "task_id" UUID,
    "agent_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "control_commands" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "requested_by" TEXT NOT NULL,
    "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "CommandStatus" NOT NULL DEFAULT 'pending',
    "approval_required" BOOLEAN NOT NULL DEFAULT false,
    "approval_reason" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMPTZ(6),
    "execution_started_at" TIMESTAMPTZ(6),
    "execution_finished_at" TIMESTAMPTZ(6),
    "execution_result" JSONB,
    "error" JSONB,
    "correlation_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "control_commands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" TEXT NOT NULL,
    "actor_type" "ActorType" NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "ts" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "request_id" TEXT,
    "before" JSONB,
    "after" JSONB,
    "reason" TEXT,
    "result" TEXT NOT NULL,
    "ip_address" INET,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_key_inventory" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "key_alias" TEXT NOT NULL,
    "last_used_at" TIMESTAMPTZ(6),
    "status" "KeyStatus" NOT NULL DEFAULT 'active',
    "usage_limit_usd" DECIMAL(14,6),
    "usage_current_usd" DECIMAL(14,6),
    "owner" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "api_key_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "agents_current_task_id_key" ON "agents"("current_task_id");

-- CreateIndex
CREATE INDEX "idx_agents_status" ON "agents"("status");

-- CreateIndex
CREATE INDEX "idx_agents_type" ON "agents"("type");

-- CreateIndex
CREATE INDEX "idx_agents_last_heartbeat" ON "agents"("last_heartbeat_at" DESC);

-- CreateIndex
CREATE INDEX "idx_workflows_status" ON "workflows"("status");

-- CreateIndex
CREATE INDEX "idx_workflows_created_at" ON "workflows"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_tasks_status" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "idx_tasks_workflow_id" ON "tasks"("workflow_id");

-- CreateIndex
CREATE INDEX "idx_tasks_agent_id" ON "tasks"("assigned_agent_id");

-- CreateIndex
CREATE INDEX "idx_tasks_priority_status" ON "tasks"("priority", "status");

-- CreateIndex
CREATE INDEX "idx_tasks_created_at" ON "tasks"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_events_ts" ON "events"("ts" DESC);

-- CreateIndex
CREATE INDEX "idx_events_workflow_id" ON "events"("workflow_id");

-- CreateIndex
CREATE INDEX "idx_events_task_id" ON "events"("task_id");

-- CreateIndex
CREATE INDEX "idx_events_agent_id" ON "events"("agent_id");

-- CreateIndex
CREATE INDEX "idx_events_correlation_id" ON "events"("correlation_id");

-- CreateIndex
CREATE INDEX "idx_events_event_type" ON "events"("event_type");

-- CreateIndex
CREATE INDEX "idx_logs_ts" ON "structured_logs"("ts" DESC);

-- CreateIndex
CREATE INDEX "idx_logs_agent_id" ON "structured_logs"("agent_id");

-- CreateIndex
CREATE INDEX "idx_logs_workflow_id" ON "structured_logs"("workflow_id");

-- CreateIndex
CREATE INDEX "idx_logs_task_id" ON "structured_logs"("task_id");

-- CreateIndex
CREATE INDEX "idx_logs_trace_id" ON "structured_logs"("trace_id");

-- CreateIndex
CREATE INDEX "idx_metric_snapshots_agent_ts" ON "agent_metric_snapshots"("agent_id", "ts" DESC);

-- CreateIndex
CREATE INDEX "idx_cost_records_ts" ON "cost_records"("ts" DESC);

-- CreateIndex
CREATE INDEX "idx_cost_records_agent_id" ON "cost_records"("agent_id");

-- CreateIndex
CREATE INDEX "idx_cost_records_workflow_id" ON "cost_records"("workflow_id");

-- CreateIndex
CREATE INDEX "idx_cost_records_provider_model" ON "cost_records"("provider", "model");

-- CreateIndex
CREATE INDEX "idx_alerts_status_severity" ON "alerts"("status", "severity");

-- CreateIndex
CREATE INDEX "idx_alerts_triggered_at" ON "alerts"("triggered_at" DESC);

-- CreateIndex
CREATE INDEX "idx_alerts_agent_id" ON "alerts"("agent_id");

-- CreateIndex
CREATE INDEX "idx_alerts_task_id" ON "alerts"("task_id");

-- CreateIndex
CREATE INDEX "idx_alerts_workflow_id" ON "alerts"("workflow_id");

-- CreateIndex
CREATE INDEX "idx_control_commands_status" ON "control_commands"("status");

-- CreateIndex
CREATE INDEX "idx_control_commands_target" ON "control_commands"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "idx_control_commands_requested_at" ON "control_commands"("requested_at" DESC);

-- CreateIndex
CREATE INDEX "idx_audit_logs_actor" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_target" ON "audit_logs"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_ts" ON "audit_logs"("ts" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "api_key_inventory_provider_key_alias_key" ON "api_key_inventory"("provider", "key_alias");

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_current_task_id_fkey" FOREIGN KEY ("current_task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_task_id_fkey" FOREIGN KEY ("parent_task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_agent_id_fkey" FOREIGN KEY ("assigned_agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_task_dependencies" ADD CONSTRAINT "workflow_task_dependencies_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_task_dependencies" ADD CONSTRAINT "workflow_task_dependencies_depends_on_task_id_fkey" FOREIGN KEY ("depends_on_task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "structured_logs" ADD CONSTRAINT "structured_logs_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "structured_logs" ADD CONSTRAINT "structured_logs_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "structured_logs" ADD CONSTRAINT "structured_logs_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_metric_snapshots" ADD CONSTRAINT "agent_metric_snapshots_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_records" ADD CONSTRAINT "cost_records_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_records" ADD CONSTRAINT "cost_records_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_records" ADD CONSTRAINT "cost_records_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

