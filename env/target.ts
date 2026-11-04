export type TargetName = 'dev' | 'prod';

export interface TargetSettings {
  APP_ENV?: string;
  BASE_URL?: string;
  LOCAL_SANDBOX_DIR?: string;
}

export interface Target {
  readonly name: TargetName;
  readonly baseURL: string;
}

const BASE_URLS: Readonly<Record<TargetName, string>> = {
  dev: 'https://dev.ai-orchestration-courses.com',
  prod: 'https://ai-orchestration-courses.com',
};

// Errors name the variable and never include its value.
function selectName(appEnv: string | undefined): TargetName {
  if (appEnv === undefined || appEnv === 'dev') return 'dev';
  if (appEnv === 'prod') return 'prod';
  throw new Error('APP_ENV must be exactly "dev" or "prod" when set.');
}

// Pure: reads only its argument, never process.env. No settings means dev.
export function resolveTarget(settings: TargetSettings = {}): Target {
  if (settings.LOCAL_SANDBOX_DIR !== undefined) {
    throw new Error('LOCAL_SANDBOX_DIR is not supported. Unset it.');
  }
  const name = selectName(settings.APP_ENV);
  const baseURL = BASE_URLS[name];
  // Exact string comparison: URL parsing would accept a trailing slash or uppercase host.
  if (settings.BASE_URL !== undefined && settings.BASE_URL !== baseURL) {
    throw new Error(`BASE_URL must be unset or exactly the canonical ${name} address.`);
  }
  return Object.freeze({ name, baseURL });
}

function readSettings(): TargetSettings {
  const { APP_ENV, BASE_URL, LOCAL_SANDBOX_DIR } = process.env;
  return { APP_ENV, BASE_URL, LOCAL_SANDBOX_DIR };
}

function sameSettings(a: TargetSettings, b: TargetSettings): boolean {
  return (
    a.APP_ENV === b.APP_ENV &&
    a.BASE_URL === b.BASE_URL &&
    a.LOCAL_SANDBOX_DIR === b.LOCAL_SANDBOX_DIR
  );
}

let pinned: { settings: TargetSettings; target: Target } | undefined;

// Validates and pins one target per process. Start a new process to switch environments.
export function getTarget(): Target {
  const settings = readSettings();
  if (pinned === undefined) {
    pinned = { settings, target: resolveTarget(settings) };
  } else if (!sameSettings(pinned.settings, settings)) {
    throw new Error(
      'APP_ENV, BASE_URL, or LOCAL_SANDBOX_DIR changed after the target was pinned. Start a new process to switch environments.',
    );
  }
  return pinned.target;
}
