import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ids = {
  users: {
    admin: '11111111-1111-4111-8111-111111111111',
    operator: '22222222-2222-4222-8222-222222222222',
    viewer: '33333333-3333-4333-8333-333333333333',
    auditor: '44444444-4444-4444-8444-444444444444'
  },
  workflows: {
    release: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    onboarding: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    incident: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'
  },
  agents: {
    programmer: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    uiux: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
    po: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3',
    infra: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4',
    graphic: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5'
  },
  tasks: {
    releaseBrief: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
    releaseApi: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2',
    releaseUi: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3',
    releaseQa: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc4',
    onboardingBrief: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc5',
    onboardingProvision: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc6',
    onboardingAssets: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc7',
    incidentTriage: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc8',
    incidentFix: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc9',
    incidentPostmortem: 'cccccccc-cccc-4ccc-8ccc-cccccccccc10'
  }
} as const;

async function main() {
  await prisma.workflowTaskDependency.deleteMany();
  await prisma.event.deleteMany();
  await prisma.structuredLog.deleteMany();
  await prisma.agentMetricSnapshot.deleteMany();
  await prisma.costRecord.deleteMany();
  await prisma.providerHealthSnapshot.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.controlCommand.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.apiKeyInventory.deleteMany();
  await prisma.task.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.createMany({
    data: [
      { id: ids.users.admin, email: 'admin@mission-control.local', displayName: 'Admin Operator', role: 'admin' },
      { id: ids.users.operator, email: 'operator@mission-control.local', displayName: 'Primary Operator', role: 'operator' },
      { id: ids.users.viewer, email: 'viewer@mission-control.local', displayName: 'Read Only Viewer', role: 'viewer' },
      { id: ids.users.auditor, email: 'auditor@mission-control.local', displayName: 'Compliance Auditor', role: 'auditor' }
    ]
  });

  await prisma.workflow.createMany({
    data: [
      {
        id: ids.workflows.release,
        name: 'Release recovery train',
        status: 'running',
        triggerType: 'manual',
        initiatedBy: 'Primary Operator',
        startedAt: new Date('2026-03-29T06:45:00Z'),
        totalTasks: 4,
        completedTasks: 1,
        failedTasks: 0,
        totalCostUsd: new Prisma.Decimal('9.284125'),
        totalTokens: BigInt(182340),
        slaClass: 'p1',
        metadata: { environment: 'staging', release: '2026.03.29-rc1' }
      },
      {
        id: ids.workflows.onboarding,
        name: 'Customer onboarding: Nordwind',
        status: 'partial',
        triggerType: 'api',
        initiatedBy: 'External API',
        startedAt: new Date('2026-03-29T05:20:00Z'),
        completedAt: new Date('2026-03-29T06:35:00Z'),
        totalTasks: 3,
        completedTasks: 2,
        failedTasks: 1,
        totalCostUsd: new Prisma.Decimal('3.117441'),
        totalTokens: BigInt(64322),
        slaClass: 'standard',
        metadata: { accountId: 'acct_nordwind' }
      },
      {
        id: ids.workflows.incident,
        name: 'Incident 4827 mitigation',
        status: 'failed',
        triggerType: 'event',
        initiatedBy: 'Pager rotation',
        startedAt: new Date('2026-03-29T04:55:00Z'),
        completedAt: new Date('2026-03-29T05:40:00Z'),
        totalTasks: 3,
        completedTasks: 1,
        failedTasks: 1,
        totalCostUsd: new Prisma.Decimal('1.992305'),
        totalTokens: BigInt(32110),
        slaClass: 'incident',
        metadata: { incidentId: 'INC-4827', service: 'gateway' }
      }
    ]
  });

  await prisma.agent.createMany({
    data: [
      {
        id: ids.agents.programmer,
        name: 'Atlas Programmer',
        type: 'programmer',
        version: '0.4.2',
        status: 'working',
        health: 'healthy',
        workerId: 'worker-programmer-1',
        lastHeartbeatAt: new Date('2026-03-29T07:41:30Z'),
        startedAt: new Date('2026-03-29T06:00:00Z'),
        restartCount: 1,
        successRate: new Prisma.Decimal('96.40'),
        avgTaskDurationMs: BigInt(742000),
        totalTasksCompleted: BigInt(128),
        tokenUsageTotal: BigInt(920000),
        costTotalUsd: new Prisma.Decimal('48.220140'),
        tags: ['backend', 'critical-path'],
        metadata: { region: 'eu-central', runtime: 'node' }
      },
      {
        id: ids.agents.uiux,
        name: 'Helio UI/UX',
        type: 'uiux',
        version: '0.3.8',
        status: 'idle',
        health: 'healthy',
        workerId: 'worker-ui-1',
        lastHeartbeatAt: new Date('2026-03-29T07:40:55Z'),
        startedAt: new Date('2026-03-29T06:10:00Z'),
        restartCount: 0,
        successRate: new Prisma.Decimal('98.10'),
        avgTaskDurationMs: BigInt(510000),
        totalTasksCompleted: BigInt(74),
        tokenUsageTotal: BigInt(310000),
        costTotalUsd: new Prisma.Decimal('19.441822'),
        tags: ['frontend', 'design']
      },
      {
        id: ids.agents.po,
        name: 'Rune Product Ops',
        type: 'po',
        version: '0.2.5',
        status: 'working',
        health: 'warning',
        workerId: 'worker-po-1',
        lastHeartbeatAt: new Date('2026-03-29T07:39:40Z'),
        startedAt: new Date('2026-03-29T05:50:00Z'),
        restartCount: 0,
        successRate: new Prisma.Decimal('93.20'),
        avgTaskDurationMs: BigInt(603000),
        totalTasksCompleted: BigInt(89),
        tokenUsageTotal: BigInt(420000),
        costTotalUsd: new Prisma.Decimal('22.904111'),
        tags: ['planning', 'ops']
      },
      {
        id: ids.agents.infra,
        name: 'Bastion Infra',
        type: 'infra',
        version: '0.5.1',
        status: 'degraded',
        health: 'critical',
        workerId: 'worker-infra-1',
        lastHeartbeatAt: new Date('2026-03-29T07:34:10Z'),
        startedAt: new Date('2026-03-29T05:40:00Z'),
        restartCount: 3,
        successRate: new Prisma.Decimal('84.60'),
        avgTaskDurationMs: BigInt(1104000),
        totalTasksCompleted: BigInt(51),
        tokenUsageTotal: BigInt(180000),
        costTotalUsd: new Prisma.Decimal('31.774510'),
        tags: ['terraform', 'infra']
      },
      {
        id: ids.agents.graphic,
        name: 'Mica Graphic',
        type: 'graphic',
        version: '0.2.1',
        status: 'stopped',
        health: 'warning',
        workerId: 'worker-graphic-1',
        lastHeartbeatAt: new Date('2026-03-29T07:12:00Z'),
        startedAt: new Date('2026-03-29T05:30:00Z'),
        restartCount: 2,
        successRate: new Prisma.Decimal('90.50'),
        avgTaskDurationMs: BigInt(455000),
        totalTasksCompleted: BigInt(33),
        tokenUsageTotal: BigInt(120000),
        costTotalUsd: new Prisma.Decimal('9.870250'),
        tags: ['assets', 'creative']
      }
    ]
  });

  await prisma.task.createMany({
    data: [
      {
        id: ids.tasks.releaseBrief,
        workflowId: ids.workflows.release,
        assignedAgentId: ids.agents.po,
        type: 'planning',
        priority: 'high',
        status: 'completed',
        title: 'Rebuild launch brief',
        description: 'Summarise regression scope, owners, and deploy gates.',
        input: { docs: ['status', 'risk-log'] },
        output: { summaryUrl: '/briefs/release-recovery' },
        createdBy: 'Primary Operator',
        startedAt: new Date('2026-03-29T06:46:00Z'),
        completedAt: new Date('2026-03-29T06:58:00Z'),
        createdAt: new Date('2026-03-29T06:45:00Z')
      },
      {
        id: ids.tasks.releaseApi,
        workflowId: ids.workflows.release,
        assignedAgentId: ids.agents.programmer,
        type: 'backend',
        priority: 'critical',
        status: 'running',
        title: 'Patch degraded overview aggregation',
        description: 'Restore overview counters after stale cache regression.',
        input: { suspectedModule: 'overview-service' },
        retryCount: 1,
        createdBy: 'Primary Operator',
        dueAt: new Date('2026-03-29T08:30:00Z'),
        startedAt: new Date('2026-03-29T07:02:00Z'),
        createdAt: new Date('2026-03-29T06:50:00Z')
      },
      {
        id: ids.tasks.releaseUi,
        workflowId: ids.workflows.release,
        assignedAgentId: ids.agents.uiux,
        type: 'frontend',
        priority: 'high',
        status: 'queued',
        title: 'Tighten operator status banner',
        description: 'Update visual treatment for degraded/live states.',
        input: { screen: 'overview' },
        createdBy: 'Admin Operator',
        dueAt: new Date('2026-03-29T09:00:00Z'),
        createdAt: new Date('2026-03-29T06:52:00Z')
      },
      {
        id: ids.tasks.releaseQa,
        workflowId: ids.workflows.release,
        parentTaskId: ids.tasks.releaseApi,
        type: 'verification',
        priority: 'normal',
        status: 'blocked',
        title: 'Verify launch metrics after patch',
        description: 'Run smoke checks after overview aggregation fix lands.',
        input: { suites: ['overview-api', 'dashboard-smoke'] },
        createdBy: 'Admin Operator',
        dueAt: new Date('2026-03-29T09:15:00Z'),
        createdAt: new Date('2026-03-29T06:55:00Z')
      },
      {
        id: ids.tasks.onboardingBrief,
        workflowId: ids.workflows.onboarding,
        assignedAgentId: ids.agents.po,
        type: 'intake',
        priority: 'normal',
        status: 'completed',
        title: 'Validate onboarding inputs',
        description: 'Confirm account scope and residency constraints.',
        input: { accountId: 'acct_nordwind' },
        output: { residency: 'eu' },
        createdBy: 'External API',
        startedAt: new Date('2026-03-29T05:20:00Z'),
        completedAt: new Date('2026-03-29T05:31:00Z'),
        createdAt: new Date('2026-03-29T05:20:00Z')
      },
      {
        id: ids.tasks.onboardingProvision,
        workflowId: ids.workflows.onboarding,
        assignedAgentId: ids.agents.infra,
        type: 'provisioning',
        priority: 'high',
        status: 'failed',
        title: 'Provision customer runtime',
        description: 'Create runtime, secrets, and baseline storage.',
        input: { region: 'eu-west-1', tier: 'business' },
        error: { code: 'TF_APPLY_FAILED', message: 'VPC quota exceeded' },
        retryCount: 2,
        maxRetries: 3,
        createdBy: 'External API',
        startedAt: new Date('2026-03-29T05:32:00Z'),
        completedAt: new Date('2026-03-29T05:49:00Z'),
        createdAt: new Date('2026-03-29T05:31:00Z')
      },
      {
        id: ids.tasks.onboardingAssets,
        workflowId: ids.workflows.onboarding,
        assignedAgentId: ids.agents.graphic,
        type: 'asset-prep',
        priority: 'low',
        status: 'completed',
        title: 'Generate onboarding asset kit',
        description: 'Prepare logos and workspace imagery.',
        input: { brandPack: 'nordwind-v2' },
        output: { assetCount: 18 },
        createdBy: 'External API',
        startedAt: new Date('2026-03-29T05:35:00Z'),
        completedAt: new Date('2026-03-29T06:10:00Z'),
        createdAt: new Date('2026-03-29T05:33:00Z')
      },
      {
        id: ids.tasks.incidentTriage,
        workflowId: ids.workflows.incident,
        assignedAgentId: ids.agents.infra,
        type: 'triage',
        priority: 'critical',
        status: 'completed',
        title: 'Triage gateway incident',
        description: 'Assess blast radius and dependency health.',
        input: { incidentId: 'INC-4827' },
        output: { impact: 'eu traffic elevated latency' },
        createdBy: 'Pager rotation',
        startedAt: new Date('2026-03-29T04:55:00Z'),
        completedAt: new Date('2026-03-29T05:08:00Z'),
        createdAt: new Date('2026-03-29T04:55:00Z')
      },
      {
        id: ids.tasks.incidentFix,
        workflowId: ids.workflows.incident,
        parentTaskId: ids.tasks.incidentTriage,
        assignedAgentId: ids.agents.programmer,
        type: 'mitigation',
        priority: 'critical',
        status: 'failed',
        title: 'Ship mitigation patch',
        description: 'Apply rollback guard and redeploy gateway worker.',
        input: { candidate: 'gateway-hotfix-4827' },
        error: { code: 'ROLLBACK_LOOP', message: 'post-deploy health gate never recovered' },
        retryCount: 1,
        maxRetries: 2,
        createdBy: 'Pager rotation',
        startedAt: new Date('2026-03-29T05:10:00Z'),
        completedAt: new Date('2026-03-29T05:40:00Z'),
        createdAt: new Date('2026-03-29T05:08:00Z')
      },
      {
        id: ids.tasks.incidentPostmortem,
        workflowId: ids.workflows.incident,
        parentTaskId: ids.tasks.incidentFix,
        assignedAgentId: ids.agents.po,
        type: 'postmortem',
        priority: 'normal',
        status: 'blocked',
        title: 'Draft incident postmortem',
        description: 'Create postmortem shell once mitigation resolves.',
        input: { template: 'incident-v1' },
        createdBy: 'Pager rotation',
        createdAt: new Date('2026-03-29T05:39:00Z')
      }
    ]
  });

  await prisma.agent.update({ where: { id: ids.agents.programmer }, data: { currentTaskId: ids.tasks.releaseApi } });

  await prisma.workflowTaskDependency.createMany({
    data: [
      { taskId: ids.tasks.releaseUi, dependsOnTaskId: ids.tasks.releaseApi, dependencyType: 'soft' },
      { taskId: ids.tasks.releaseQa, dependsOnTaskId: ids.tasks.releaseApi, dependencyType: 'hard' },
      { taskId: ids.tasks.onboardingProvision, dependsOnTaskId: ids.tasks.onboardingBrief, dependencyType: 'hard' },
      { taskId: ids.tasks.onboardingAssets, dependsOnTaskId: ids.tasks.onboardingBrief, dependencyType: 'soft' },
      { taskId: ids.tasks.incidentFix, dependsOnTaskId: ids.tasks.incidentTriage, dependencyType: 'hard' },
      { taskId: ids.tasks.incidentPostmortem, dependsOnTaskId: ids.tasks.incidentFix, dependencyType: 'hard' }
    ]
  });

  await prisma.event.createMany({
    data: [
      {
        id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
        sourceType: 'workflow',
        sourceId: ids.workflows.release,
        eventType: 'workflow.started',
        severity: 'info',
        ts: new Date('2026-03-29T06:45:00Z'),
        correlationId: 'corr-release-001',
        workflowId: ids.workflows.release,
        message: 'Release recovery train started.',
        payload: { by: 'Primary Operator' }
      },
      {
        id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd2',
        sourceType: 'task',
        sourceId: ids.tasks.onboardingProvision,
        eventType: 'task.failed',
        severity: 'error',
        ts: new Date('2026-03-29T05:49:00Z'),
        correlationId: 'corr-onboarding-002',
        workflowId: ids.workflows.onboarding,
        taskId: ids.tasks.onboardingProvision,
        agentId: ids.agents.infra,
        message: 'Provisioning failed due to quota exhaustion.',
        payload: { code: 'TF_APPLY_FAILED' }
      },
      {
        id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd3',
        sourceType: 'agent',
        sourceId: ids.agents.infra,
        eventType: 'agent.degraded',
        severity: 'critical',
        ts: new Date('2026-03-29T07:33:45Z'),
        correlationId: 'corr-infra-health-001',
        agentId: ids.agents.infra,
        message: 'Infra agent heartbeat delay exceeded threshold.',
        payload: { staleSeconds: 220 }
      }
    ]
  });

  await prisma.structuredLog.createMany({
    data: [
      {
        id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
        ts: new Date('2026-03-29T07:05:00Z'),
        level: 'info',
        service: 'mission-control-api',
        workflowId: ids.workflows.release,
        taskId: ids.tasks.releaseApi,
        agentId: ids.agents.programmer,
        traceId: 'trace-release-api-1',
        spanId: 'span-001',
        message: 'Applying overview aggregation patch.',
        context: { module: 'overview' }
      },
      {
        id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',
        ts: new Date('2026-03-29T05:48:30Z'),
        level: 'error',
        service: 'infra-runner',
        workflowId: ids.workflows.onboarding,
        taskId: ids.tasks.onboardingProvision,
        agentId: ids.agents.infra,
        traceId: 'trace-onboard-infra-1',
        spanId: 'span-002',
        message: 'Terraform apply failed: VPC quota exceeded.',
        context: { provider: 'aws' }
      }
    ]
  });

  await prisma.agentMetricSnapshot.createMany({
    data: [
      {
        id: 'ffffffff-ffff-4fff-8fff-fffffffffff1',
        agentId: ids.agents.programmer,
        ts: new Date('2026-03-29T07:40:00Z'),
        cpuPct: new Prisma.Decimal('72.40'),
        memoryMb: new Prisma.Decimal('812.50'),
        tokensPerMin: new Prisma.Decimal('1880.00'),
        requestsPerMin: new Prisma.Decimal('14.00'),
        avgLatencyMs: new Prisma.Decimal('842.20'),
        successRateWindow: new Prisma.Decimal('97.00'),
        queueDepth: 1,
        activeTasks: 1,
        costPerHourUsd: new Prisma.Decimal('3.212000')
      },
      {
        id: 'ffffffff-ffff-4fff-8fff-fffffffffff2',
        agentId: ids.agents.infra,
        ts: new Date('2026-03-29T07:34:00Z'),
        cpuPct: new Prisma.Decimal('91.20'),
        memoryMb: new Prisma.Decimal('1204.90'),
        tokensPerMin: new Prisma.Decimal('420.00'),
        requestsPerMin: new Prisma.Decimal('6.00'),
        avgLatencyMs: new Prisma.Decimal('1580.40'),
        successRateWindow: new Prisma.Decimal('63.00'),
        queueDepth: 2,
        activeTasks: 1,
        costPerHourUsd: new Prisma.Decimal('4.984200')
      }
    ]
  });

  await prisma.costRecord.createMany({
    data: [
      {
        id: '12121212-1212-4212-8212-121212121211',
        ts: new Date('2026-03-29T07:06:00Z'),
        provider: 'openai',
        model: 'gpt-5.4',
        agentId: ids.agents.programmer,
        workflowId: ids.workflows.release,
        taskId: ids.tasks.releaseApi,
        promptTokens: BigInt(12000),
        completionTokens: BigInt(3400),
        totalTokens: BigInt(15400),
        costUsd: new Prisma.Decimal('0.612450'),
        requestCount: 3,
        metadata: { environment: 'staging' }
      },
      {
        id: '12121212-1212-4212-8212-121212121212',
        ts: new Date('2026-03-29T05:40:00Z'),
        provider: 'anthropic',
        model: 'claude-opus',
        agentId: ids.agents.po,
        workflowId: ids.workflows.onboarding,
        taskId: ids.tasks.onboardingBrief,
        promptTokens: BigInt(5300),
        completionTokens: BigInt(1700),
        totalTokens: BigInt(7000),
        costUsd: new Prisma.Decimal('0.188210'),
        requestCount: 2
      }
    ]
  });

  await prisma.providerHealthSnapshot.createMany({
    data: [
      {
        id: '13131313-1313-4313-8313-131313131311',
        provider: 'openai',
        status: 'degraded',
        latencyMs: new Prisma.Decimal('842.20'),
        errorRate: new Prisma.Decimal('0.041'),
        details: { region: 'eu' },
        ts: new Date('2026-03-29T07:38:00Z')
      },
      {
        id: '13131313-1313-4313-8313-131313131312',
        provider: 'anthropic',
        status: 'healthy',
        latencyMs: new Prisma.Decimal('430.10'),
        errorRate: new Prisma.Decimal('0.007'),
        details: { region: 'eu' },
        ts: new Date('2026-03-29T07:38:00Z')
      }
    ]
  });

  await prisma.alert.createMany({
    data: [
      {
        id: '14141414-1414-4414-8414-141414141411',
        type: 'agent_stuck',
        severity: 'critical',
        status: 'open',
        sourceId: ids.agents.infra,
        sourceType: 'agent',
        title: 'Infra agent heartbeat stale',
        description: 'Bastion Infra heartbeat is outside tolerated threshold.',
        triggeredAt: new Date('2026-03-29T07:34:15Z'),
        runbookUrl: 'https://runbooks.local/agents/heartbeat-stale',
        payload: { staleSeconds: 220 },
        agentId: ids.agents.infra
      },
      {
        id: '14141414-1414-4414-8414-141414141412',
        type: 'task_failed',
        severity: 'warning',
        status: 'acknowledged',
        sourceId: ids.tasks.onboardingProvision,
        sourceType: 'task',
        title: 'Onboarding provisioning failed',
        description: 'Nordwind provisioning failed because quota is exhausted.',
        triggeredAt: new Date('2026-03-29T05:49:10Z'),
        acknowledgedBy: 'Primary Operator',
        acknowledgedAt: new Date('2026-03-29T06:00:00Z'),
        runbookUrl: 'https://runbooks.local/tasks/provisioning-failed',
        payload: { code: 'TF_APPLY_FAILED' },
        workflowId: ids.workflows.onboarding,
        taskId: ids.tasks.onboardingProvision,
        agentId: ids.agents.infra
      }
    ]
  });

  await prisma.controlCommand.createMany({
    data: [
      {
        id: '15151515-1515-4515-8515-151515151511',
        type: 'restart-agent',
        targetType: 'agent',
        targetId: ids.agents.infra,
        payload: { mode: 'graceful' },
        requestedBy: 'Primary Operator',
        requestedAt: new Date('2026-03-29T07:35:00Z'),
        status: 'pending',
        approvalRequired: true,
        approvalReason: 'infra agent is degraded and running provisioning work',
        correlationId: 'cmd-infra-restart-1'
      },
      {
        id: '15151515-1515-4515-8515-151515151512',
        type: 'retry-task',
        targetType: 'task',
        targetId: ids.tasks.onboardingProvision,
        payload: { retryFrom: 'provisioning' },
        requestedBy: 'Admin Operator',
        requestedAt: new Date('2026-03-29T06:02:00Z'),
        status: 'executing',
        approvedBy: 'Admin Operator',
        approvedAt: new Date('2026-03-29T06:02:10Z'),
        executionStartedAt: new Date('2026-03-29T06:03:00Z'),
        correlationId: 'cmd-task-retry-1'
      }
    ]
  });

  await prisma.auditLog.createMany({
    data: [
      {
        id: '16161616-1616-4616-8616-161616161611',
        actorId: ids.users.operator,
        actorType: 'user',
        action: 'command.requested',
        targetType: 'agent',
        targetId: ids.agents.infra,
        ts: new Date('2026-03-29T07:35:00Z'),
        requestId: 'req-001',
        after: { commandId: '15151515-1515-4515-8515-151515151511' },
        reason: 'agent heartbeat stale',
        result: 'accepted',
        ipAddress: '127.0.0.1'
      }
    ]
  });

  await prisma.apiKeyInventory.createMany({
    data: [
      {
        id: '17171717-1717-4717-8717-171717171711',
        provider: 'openai',
        keyAlias: 'primary-eu',
        lastUsedAt: new Date('2026-03-29T07:06:00Z'),
        status: 'active',
        usageLimitUsd: new Prisma.Decimal('250.000000'),
        usageCurrentUsd: new Prisma.Decimal('81.440122'),
        owner: 'platform',
        metadata: { region: 'eu', seeded: true }
      },
      {
        id: '17171717-1717-4717-8717-171717171712',
        provider: 'anthropic',
        keyAlias: 'backup',
        lastUsedAt: new Date('2026-03-29T05:40:00Z'),
        status: 'rotating',
        usageLimitUsd: new Prisma.Decimal('150.000000'),
        usageCurrentUsd: new Prisma.Decimal('34.118000'),
        owner: 'platform',
        metadata: { seeded: true }
      }
    ]
  });

  console.log('Seeded Mission Control MVP demo data.');
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
