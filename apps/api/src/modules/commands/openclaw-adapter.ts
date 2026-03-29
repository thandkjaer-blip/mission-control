import { spawn } from 'node:child_process';

const KILL_GRACE_MS = 5_000;

export interface OpenClawAdapterResult {
  ok: boolean;
  summary: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  accepted: boolean;
  response?: Record<string, unknown> | null;
}

export async function sendMessageToJarvis(message: string, timeoutMs = 60_000): Promise<OpenClawAdapterResult> {
  return new Promise((resolve) => {
    const child = spawn(
      'openclaw',
      ['agent', '--agent', 'main', '--message', message, '--json', '--thinking', 'low', '--timeout', String(Math.max(1, Math.ceil(timeoutMs / 1000)))],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: process.env
      }
    );

    let stdout = '';
    let stderr = '';
    let finished = false;
    let timedOut = false;
    let killTimer: NodeJS.Timeout | null = null;

    const finish = (result: OpenClawAdapterResult) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      if (killTimer) clearTimeout(killTimer);
      resolve(result);
    };

    const timer = setTimeout(() => {
      if (finished) return;
      timedOut = true;
      child.kill('SIGTERM');
      killTimer = setTimeout(() => {
        if (finished) return;
        child.kill('SIGKILL');
      }, KILL_GRACE_MS);
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      finish({
        ok: false,
        accepted: false,
        summary: `Could not start OpenClaw: ${error.message}`,
        stdout,
        stderr: `${stderr}${stderr ? '\n' : ''}${error.message}`,
        exitCode: null,
        signal: null
      });
    });

    child.on('close', (exitCode, signal) => {
      let response: Record<string, unknown> | null = null;
      try {
        response = stdout.trim() ? (JSON.parse(stdout) as Record<string, unknown>) : null;
      } catch {
        response = null;
      }

      if (timedOut) {
        finish({
          ok: false,
          accepted: false,
          summary: 'OpenClaw timed out before confirming the command.',
          stdout,
          stderr,
          exitCode,
          signal,
          response
        });
        return;
      }

      const ok = exitCode === 0;
      finish({
        ok,
        accepted: ok,
        summary: ok ? 'Jarvis command accepted by OpenClaw.' : `OpenClaw exited with code ${exitCode ?? 'unknown'}.`,
        stdout,
        stderr,
        exitCode,
        signal,
        response
      });
    });
  });
}
