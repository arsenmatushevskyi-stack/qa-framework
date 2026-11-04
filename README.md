# QA Framework

A Playwright and TypeScript test framework for the course applications.

## Setup

Requires Node.js 24.

```sh
npm ci
npx playwright install chromium
```

## Commands

| Command | What it does |
|---|---|
| `npm run typecheck` | Checks TypeScript without running tests |
| `npm run test:safety` | Runs the isolated environment checks, with no browser or course services |
| `npm run test:list` | Lists the browser tests without running them |
| `npm test -- --reporter=list` | Runs the browser tests on dev |
| `npm run test:prod -- --reporter=list` | Runs the browser tests on prod. All current tests are dev-only, so all are skipped |

## Environments

| Name | Address |
|---|---|
| `dev` | https://dev.ai-orchestration-courses.com |
| `prod` | https://ai-orchestration-courses.com |

[`env/target.ts`](env/target.ts) is the single source of truth for environment selection and URLs.

- A missing `APP_ENV` defaults to `dev`. Only the exact values `dev` and `prod` are accepted, and anything else causes an error.
- Leave `BASE_URL` unset. If it's set, it must exactly match the selected address.
- `LOCAL_SANDBOX_DIR` is rejected.
- Each process keeps one target. Start a new process to switch environments.
- Select production intentionally, using `npm run test:prod`.

## Environment Safety

- `runIfEnv` skips tests that are not allowed in the selected environment.
- `envGuard` blocks wrapped data-changing actions in production.
- `currentEnv` reads the selected environment through the shared resolver.

These helpers do not automatically prevent unguarded requests, import-time side effects, or unsafe setup code. Imports and setup must be reviewed before selecting production.

## Retries

Playwright retries are set to zero so failures remain visible rather than being hidden by automatic reruns.

## Browser Tests

The project contains three development-only smoke tests in one Chromium project:

1. The development banner is visible and identifies the development environment.
2. The article list contains at least one visible article card.
3. After logging in as the training author, the categories page contains at least one visible category.

The tests check for at least one visible item because the requirements do not specify an exact count. An exact-count assertion would be appropriate when testing a fixed dataset, or when verifying that adding or deleting a category changes the count.

## Test Data and Traces

- `AUTHOR` in [`tests/support/users.ts`](tests/support/users.ts) is the course's fictional training account. Never commit real credentials.
- Failed runs keep traces in `test-results/`, which git ignores. Traces can contain typed passwords and session cookies, so do not share any that contain real session credentials.
