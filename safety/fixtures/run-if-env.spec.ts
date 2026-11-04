// Run by safety/run-if-env.test.ts. These tests take no `page`, so no browser starts.
import { expect, test } from '@playwright/test';
import { runIfEnv } from '../../env/runIfEnv.ts';
import type { AppEnv } from '../../env/target.ts';

const CASES: Record<string, AppEnv[]> = {
  'dev only': ['dev'],
  'prod only': ['prod'],
  'dev and prod': ['dev', 'prod'],
};

for (const [title, allowed] of Object.entries(CASES)) {
  test.describe(`describe level, ${title}`, () => {
    runIfEnv(test, allowed);

    test('body', () => {
      console.log('BODY_RAN');
    });
  });

  test(`in body, ${title}`, () => {
    runIfEnv(test, allowed);
    console.log('BODY_RAN');
  });
}

test('rejects an empty allowed list', () => {
  expect(() => runIfEnv(test, [])).toThrow('at least one allowed environment');
});

test('rejects an invalid allowed name', () => {
  expect(() => runIfEnv(test, ['DEV' as AppEnv])).toThrow('APP_ENV must be exactly');
});
