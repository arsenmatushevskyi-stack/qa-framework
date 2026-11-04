// getTarget, currentEnv, and envGuard, each in a fresh process with its own pinned target.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cleanEnv, runProbe } from './support/fresh-process.ts';

const DEV = 'https://dev.ai-orchestration-courses.com';
const PROD = 'https://ai-orchestration-courses.com';
const MARKER = 'secret-marker';

function probeJson(args: string[], env: Record<string, string> = {}): any {
  const result = runProbe(args, env);
  assert.equal(result.status, 0, 'probe should exit cleanly');
  return JSON.parse(result.stdout);
}

test('cleanEnv removes inherited target and Playwright settings', () => {
  const env = cleanEnv({ KEPT: 'extra' }, {
    PATH: '/bin',
    APP_ENV: 'prod',
    BASE_URL: 'x',
    LOCAL_SANDBOX_DIR: 'x',
    NODE_TEST_CONTEXT: 'x',
    PW_TEST_REPORTER: 'x',
    PLAYWRIGHT_JSON_OUTPUT_NAME: 'x',
  });
  assert.deepEqual(env, { PATH: '/bin', KEPT: 'extra' });
});

const VALID: [string, Record<string, string>, string, string][] = [
  ['absent APP_ENV', {}, 'dev', DEV],
  ['APP_ENV=dev', { APP_ENV: 'dev' }, 'dev', DEV],
  ['APP_ENV=prod', { APP_ENV: 'prod' }, 'prod', PROD],
  ['absent APP_ENV with dev BASE_URL', { BASE_URL: DEV }, 'dev', DEV],
  ['APP_ENV=dev with dev BASE_URL', { APP_ENV: 'dev', BASE_URL: DEV }, 'dev', DEV],
  ['APP_ENV=prod with prod BASE_URL', { APP_ENV: 'prod', BASE_URL: PROD }, 'prod', PROD],
];

for (const [title, env, name, baseURL] of VALID) {
  test(`getTarget and currentEnv: ${title}`, () => {
    assert.deepEqual(probeJson(['target'], env), {
      name,
      baseURL,
      currentEnv: name,
      frozen: true,
      pinned: true,
    });
  });
}

// The third item is the rejected value that must not appear in any output. Blank values have none.
const INVALID: [string, Record<string, string>, string?][] = [
  ['empty APP_ENV', { APP_ENV: '' }],
  ['whitespace APP_ENV', { APP_ENV: '   ' }],
  ['uppercase APP_ENV', { APP_ENV: 'DEV' }, 'DEV'],
  ['unknown APP_ENV', { APP_ENV: MARKER }, MARKER],
  ['blank BASE_URL', { BASE_URL: '' }],
  ['arbitrary BASE_URL', { BASE_URL: `https://${MARKER}.example` }, MARKER],
  ['mismatched BASE_URL on prod', { APP_ENV: 'prod', BASE_URL: DEV }, DEV],
  ['LOCAL_SANDBOX_DIR', { LOCAL_SANDBOX_DIR: `/tmp/${MARKER}` }, MARKER],
];

for (const [title, env, rejected] of INVALID) {
  test(`getTarget fails without echoing: ${title}`, () => {
    const result = runProbe(['target'], env);
    assert.notEqual(result.status, 0);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /(APP_ENV must be exactly|BASE_URL must be unset|LOCAL_SANDBOX_DIR is not supported)/);
    if (rejected) assert.ok(!result.stderr.includes(rejected), 'value was echoed');
  });
}

test('resolveTarget ignores process.env', () => {
  assert.deepEqual(probeJson(['pure'], { APP_ENV: 'prod' }), { name: 'dev', baseURL: DEV });
  assert.deepEqual(probeJson(['pure'], { LOCAL_SANDBOX_DIR: MARKER }), { name: 'dev', baseURL: DEV });
});

for (const mode of ['guard-sync', 'guard-async']) {
  // Control: shows the dummy action does run and count when the guard allows it.
  test(`${mode}: dev runs the action once and returns its result`, () => {
    for (const appEnv of [{}, { APP_ENV: 'dev' }] as Record<string, string>[]) {
      assert.deepEqual(probeJson([mode], appEnv), { threw: false, result: 'action-result', calls: 1 });
    }
  });

  test(`${mode}: prod throws and the action is never called`, () => {
    assert.deepEqual(probeJson([mode], { APP_ENV: 'prod' }), {
      threw: true,
      message: 'envGuard blocked a data-changing action on "prod".',
      calls: 0,
    });
  });

  for (const [title, env, rejected] of INVALID) {
    test(`${mode}: ${title} throws and the action is never called`, () => {
      const outcome = probeJson([mode], env);
      assert.equal(outcome.threw, true);
      assert.equal(outcome.calls, 0);
      if (rejected) assert.ok(!outcome.message.includes(rejected), 'value was echoed');
    });
  }
}

const PIN_CHANGES: [string, Record<string, string>, string[]][] = [
  ['dev to prod', { APP_ENV: 'dev' }, ['APP_ENV', 'prod']],
  ['prod to dev', { APP_ENV: 'prod' }, ['APP_ENV', 'dev']],
  ['unset to dev', {}, ['APP_ENV', 'dev']],
  ['prod to unset', { APP_ENV: 'prod' }, ['APP_ENV']],
  ['BASE_URL added', {}, ['BASE_URL', DEV]],
  ['LOCAL_SANDBOX_DIR added', {}, ['LOCAL_SANDBOX_DIR', `/tmp/${MARKER}`]],
];

for (const [title, env, change] of PIN_CHANGES) {
  test(`pinned process rejects a change: ${title}`, () => {
    const outcome = probeJson(['pin-change', ...change], env);
    for (const helper of [outcome.getTarget, outcome.currentEnv, outcome.envGuard]) {
      assert.equal(helper.threw, true);
      assert.match(helper.message, /changed after the target was pinned/);
      assert.ok(!helper.message.includes(MARKER), 'value was echoed');
    }
    assert.equal(outcome.calls, 0);
  });
}
