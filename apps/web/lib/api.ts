import type {
  AgentDetailDto,
  AgentsListDto,
  CommandAcceptedDto,
  CommandDetailDto,
  CommandsListDto,
  OverviewDto,
  RuntimeRefreshResultDto,
  RuntimeSourceDto,
  SendToJarvisCommandRequest,
  TaskDetailDto,
  TasksListDto,
  WorkflowDetailDto,
  WorkflowsListDto,
} from '@mission-control/shared';

const apiBaseUrl =
  process.env.MISSION_CONTROL_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4001';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function readJson<T>(path: string): Promise<T> {
  const url = `${apiBaseUrl}${path}`;

  let response: Response;

  try {
    response = await fetch(url, {
      cache: 'no-store',
      headers: {
        accept: 'application/json',
      },
    });
  } catch (error) {
    throw new ApiClientError(`Could not reach Mission Control API at ${url}.`, undefined, error);
  }

  if (!response.ok) {
    throw new ApiClientError(`Mission Control API returned ${response.status} for ${path}.`, response.status);
  }

  return (await response.json()) as T;
}

async function writeJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const url = `${apiBaseUrl}${path}`;

  let response: Response;

  try {
    response = await fetch(url, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new ApiClientError(`Could not reach Mission Control API at ${url}.`, undefined, error);
  }

  if (!response.ok) {
    throw new ApiClientError(`Mission Control API returned ${response.status} for ${path}.`, response.status);
  }

  return (await response.json()) as T;
}

export function getApiBaseUrl() {
  return apiBaseUrl;
}

export async function getOverview() {
  return readJson<OverviewDto>('/api/v1/overview');
}

export async function getRuntimeSource() {
  return readJson<RuntimeSourceDto>('/api/v1/runtime-source');
}

export async function refreshRuntimeSource() {
  return writeJson<RuntimeRefreshResultDto>('/api/v1/runtime-source/refresh', {});
}

export async function getAgents(searchParams?: URLSearchParams) {
  const suffix = searchParams?.size ? `?${searchParams.toString()}` : '';
  return readJson<AgentsListDto>(`/api/v1/agents${suffix}`);
}

export async function getAgent(agentId: string) {
  return readJson<AgentDetailDto>(`/api/v1/agents/${agentId}`);
}

export async function getTasks(searchParams?: URLSearchParams) {
  const suffix = searchParams?.size ? `?${searchParams.toString()}` : '';
  return readJson<TasksListDto>(`/api/v1/tasks${suffix}`);
}

export async function getTask(taskId: string) {
  return readJson<TaskDetailDto>(`/api/v1/tasks/${taskId}`);
}

export async function getWorkflows(searchParams?: URLSearchParams) {
  const suffix = searchParams?.size ? `?${searchParams.toString()}` : '';
  return readJson<WorkflowsListDto>(`/api/v1/workflows${suffix}`);
}

export async function getWorkflow(workflowId: string) {
  return readJson<WorkflowDetailDto>(`/api/v1/workflows/${workflowId}`);
}

export async function getCommands(searchParams?: URLSearchParams) {
  const suffix = searchParams?.size ? `?${searchParams.toString()}` : '';
  return readJson<CommandsListDto>(`/api/v1/commands${suffix}`);
}

export async function getCommand(commandId: string) {
  return readJson<CommandDetailDto>(`/api/v1/commands/${commandId}`);
}

export async function sendToJarvis(payload: SendToJarvisCommandRequest) {
  return writeJson<CommandAcceptedDto>('/api/v1/commands/send-to-jarvis', payload as unknown as Record<string, unknown>);
}
