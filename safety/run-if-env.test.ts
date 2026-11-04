// Runs the fixture through the real Playwright runner and checks what it reported.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { cleanEnv, runNode } from './support/fresh-process.ts';

const CLI = fileURLToPath(import.meta.resolve('@playwright/test/cli'));
const CONFIG = fileURLToPath(new URL('./fixtures/playwright.config.ts', import.meta.url));

interface Reported {
  status: string;
  bodyRan: boolean;
  reasons: string[];
}

function collect(suite: any, parents: string[], found: Map<string, Reported>): void {
  for (const spec of suite.specs ?? []) {
    const reported = spec.tests[0];
    const result = reported.results[0];
    const annotations = [...(reported.annotations ?? []), ...(result.annotations ?? [])];
    found.set([...parents, spec.title].join(' > '), {
      status: result.status,
      bodyRan: (result.stdout ?? []).some((entry: any) => entry.text?.includes('BODY_RAN')),
      reasons: annotations.filter((a: any) => a.type === 'skip').map((a: any) => a.description),
    });
  }
  for (const child of suite.suites ?? []) {
    const isFile = child.title === child.file;
    collect(child, isFile ? parents : [...parents, child.title], found);
  }
}

function runFixture(appEnv: string, workspace: string): Map<string, Reported> {
  const result = runNode(
    [CLI, 'test', '--config', CONFIG, '--reporter=json', `--output=${join(workspace, 'output')}`],
    cleanEnv({
      APP_ENV: appEnv,
      // An empty browser folder: anything that tried to start a browser would fail.
      PLAYWRIGHT_BROWSERS_PATH: join(workspace, 'no-browsers'),
    }),
  );
  assert.equal(result.status, 0, 'fixture run should exit cleanly');
  const found = new Map<string, Reported>();
  collect(JSON.parse(result.stdout), [], found);
  return found;
}

const EXPECTED: Record<string, Record<string, string>> = {
  dev: { 'dev only': 'passed', 'prod only': 'skipped', 'dev and prod': 'passed' },
  prod: { 'dev only': 'skipped', 'prod only': 'passed', 'dev and prod': 'passed' },
};
const ALLOWED_NAMES: Record<string, string> = {
  'dev only': 'dev',
  'prod only': 'prod',
  'dev and prod': 'dev, prod',
};

for (const appEnv of ['dev', 'prod']) {
  describe(`runIfEnv with ${appEnv} selected`, () => {
    let workspace: string;
    let reported: Map<string, Reported>;

    before(() => {
      workspace = mkdtempSync(join(tmpdir(), 'qa-safety-'));
      reported = runFixture(appEnv, workspace);
    });
    after(() => rmSync(workspace, { recursive: true, force: true }));

    test('reports every fixture test', () => {
      assert.equal(reported.size, 8);
    });

    for (const [title, expected] of Object.entries(EXPECTED[appEnv]!)) {
      const locations = [`describe level, ${title} > body`, `in body, ${title}`];

      for (const location of locations) {
        test(`${location}: ${expected}`, () => {
          const test = reported.get(location);
          assert.ok(test, 'fixture test should be reported');
          assert.equal(test.status, expected);
          assert.equal(test.bodyRan, expected === 'passed');
          if (expected === 'skipped') {
            assert.ok(test.reasons.length > 0, 'a skip needs a reason');
            for (const reason of test.reasons) {
              assert.equal(
                reason,
                `Selected environment "${appEnv}" is not allowed. Allowed: ${ALLOWED_NAMES[title]}`,
              );
            }
          } else {
            assert.deepEqual(test.reasons, []);
          }
        });
      }
    }

    for (const title of ['rejects an empty allowed list', 'rejects an invalid allowed name']) {
      test(`${title}, with no silent skip`, () => {
        const test = reported.get(title);
        assert.equal(test?.status, 'passed');
        assert.deepEqual(test?.reasons, []);
      });
    }
  });
}
