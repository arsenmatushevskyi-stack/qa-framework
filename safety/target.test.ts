// Input cases for the pure resolver. In memory, with no child processes.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveTarget, type TargetSettings } from '../env/target.ts';

const DEV = 'https://dev.ai-orchestration-courses.com';
const PROD = 'https://ai-orchestration-courses.com';

function assertRejected(settings: TargetSettings, supplied: string, expected: RegExp): void {
  assert.throws(
    () => resolveTarget(settings),
    (error: Error) => {
      assert.match(error.message, expected);
      // A blank value is a substring of any message, so only non-blank values can be checked.
      if (supplied.trim() !== '') assert.ok(!error.message.includes(supplied), 'value was echoed');
      return true;
    },
  );
}

test('no settings and empty settings select dev', () => {
  assert.deepEqual(resolveTarget(), { name: 'dev', baseURL: DEV });
  assert.deepEqual(resolveTarget({}), { name: 'dev', baseURL: DEV });
});

test('exact APP_ENV values select their target', () => {
  assert.deepEqual(resolveTarget({ APP_ENV: 'dev' }), { name: 'dev', baseURL: DEV });
  assert.deepEqual(resolveTarget({ APP_ENV: 'prod' }), { name: 'prod', baseURL: PROD });
});

for (const value of ['', ' ', '   ', '\t', ' dev ', 'dev\n', ' prod', 'DEV', 'Dev', 'PROD', 'Prod', 'staging', 'constructor', '__proto__']) {
  test(`APP_ENV ${JSON.stringify(value)} fails`, () => {
    assertRejected({ APP_ENV: value }, value, /^APP_ENV must be exactly/);
  });
}

test('BASE_URL may be absent or exactly the selected address', () => {
  assert.equal(resolveTarget({ BASE_URL: DEV }).baseURL, DEV);
  assert.equal(resolveTarget({ APP_ENV: 'dev', BASE_URL: DEV }).baseURL, DEV);
  assert.equal(resolveTarget({ APP_ENV: 'prod', BASE_URL: PROD }).baseURL, PROD);
});

const INVALID_BASE_URLS = (selected: string, other: string): string[] => [
  other,
  '',
  ' ',
  `${selected}/`,
  `${selected}/login`,
  `${selected}?a=1`,
  `${selected}#top`,
  `${selected}:443`,
  ` ${selected}`,
  selected.toUpperCase(),
  selected.replace('https:', 'http:'),
  'http://localhost:3000',
  'https://secret-marker.example',
];

for (const [appEnv, selected, other] of [['dev', DEV, PROD], ['prod', PROD, DEV]] as const) {
  for (const value of INVALID_BASE_URLS(selected, other)) {
    test(`${appEnv} rejects BASE_URL ${JSON.stringify(value)} without echoing it`, () => {
      assertRejected({ APP_ENV: appEnv, BASE_URL: value }, value, /^BASE_URL must be unset or exactly/);
    });
  }
}

test('absent APP_ENV selects dev, so the prod address is a mismatch', () => {
  assertRejected({ BASE_URL: PROD }, PROD, /^BASE_URL must be unset or exactly/);
});

for (const value of ['', ' ', '/tmp/secret-marker']) {
  test(`LOCAL_SANDBOX_DIR ${JSON.stringify(value)} fails without echoing it`, () => {
    assertRejected({ LOCAL_SANDBOX_DIR: value }, value, /^LOCAL_SANDBOX_DIR is not supported/);
    assertRejected({ APP_ENV: 'dev', LOCAL_SANDBOX_DIR: value }, value, /^LOCAL_SANDBOX_DIR is not supported/);
  });
}

test('the result is frozen', () => {
  assert.ok(Object.isFrozen(resolveTarget()));
});
