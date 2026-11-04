import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));

const PROBE = fileURLToPath(new URL('../fixtures/probe.ts', import.meta.url));

const REMOVED = new Set(['APP_ENV', 'BASE_URL', 'LOCAL_SANDBOX_DIR', 'NODE_TEST_CONTEXT']);

// Copies the environment without anything that could select a target or redirect Playwright.
export function cleanEnv(
  extra: Record<string, string> = {},
  source: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(source)) {
    if (REMOVED.has(key) || key.startsWith('PW_') || key.startsWith('PLAYWRIGHT_')) continue;
    env[key] = value;
  }
  return { ...env, ...extra };
}

export interface ProcessResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

export function runNode(args: string[], env: NodeJS.ProcessEnv): ProcessResult {
  const result = spawnSync(process.execPath, ['--no-warnings', ...args], {
    cwd: REPO_ROOT,
    env,
    encoding: 'utf8',
  });
  if (result.error) throw result.error;
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

// Each call is a new process, so each one validates and pins its own target.
export function runProbe(args: string[], env: Record<string, string> = {}): ProcessResult {
  return runNode([PROBE, ...args], cleanEnv(env));
}
