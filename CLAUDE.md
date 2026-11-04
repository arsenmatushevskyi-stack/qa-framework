# QA Framework

Playwright + TypeScript tests for the supplied course applications. Overview: [README.md](README.md).

## Boundaries
- The only target source is [env/target.ts](env/target.ts). Do not add another resolver, local server, or alternate target.
- Switch environments by starting a new process with `APP_ENV`. Leave `BASE_URL` unset.
- Test helpers import [tests/support/env.ts](tests/support/env.ts), never [playwright.config.ts](playwright.config.ts).
- Locate elements by `data-testid`. Keep retries at 0 and one Chromium project.
- Do not add Page Objects, Jira, database, MCP, or CI unless asked.
- Run against prod only when the user explicitly asks in that task.
- Never read `.env` files, auth state, or keys. Never commit credentials.

## Commands
- `npm ci`: clean install from the lockfile
- `npx playwright install chromium`: install the browser
- `npm test`: browser tests on dev
- `npm run test:prod`: browser tests on prod
- `npm run test:list`: list tests without running them
- `npm run typecheck`: check types only
- `npm run test:safety`: isolated checks, no browser or course services

## Settings
- Permissions: [.claude/settings.json](.claude/settings.json)
