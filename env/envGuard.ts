import { currentEnv } from './target.ts';

// Runs a data-changing action on dev only. Any other target throws before the action is called.
export function envGuard<T>(action: () => T): T {
  const selected = currentEnv();
  if (selected !== 'dev') {
    throw new Error(`envGuard blocked a data-changing action on "${selected}".`);
  }
  return action();
}
