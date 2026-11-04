import type { TestType } from '@playwright/test';
import { currentEnv, resolveTarget, type AppEnv } from './target.ts';

// Marks the test skipped unless the selected environment is allowed.
export function runIfEnv(test: TestType<any, any>, allowed: readonly AppEnv[]): void {
  if (allowed.length === 0) {
    throw new Error('runIfEnv needs at least one allowed environment.');
  }
  // Playwright does not typecheck, so a bad name must fail here rather than skip silently.
  for (const name of allowed) resolveTarget({ APP_ENV: name });
  const selected = currentEnv();
  test.skip(
    !allowed.includes(selected),
    `Selected environment "${selected}" is not allowed. Allowed: ${allowed.join(', ')}`,
  );
}
