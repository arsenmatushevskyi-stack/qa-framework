# Week 2 Baseline

## 2026-11-05: starting baseline

All four checks passed on `main` at `b77e43e` (merge of pull request #1, Week 1). `week-2` was then created from that same commit and published.

### Starting point
| Item | Value |
|---|---|
| Repository | `arsenmatushevskyi-stack/qa-framework` (`origin`, SSH) |
| Commit tested | `b77e43e` Merge pull request #1 from arsenmatushevskyi-stack/week-1 (tag `week1-end`) |
| Branch when tested | `main`, up to date with `origin/main` after `git pull --ff-only` |
| `week-2` before this run | Did not exist locally or on GitHub |
| Working tree | Clean before and after the checks |

### Environment
| Item | Value |
|---|---|
| OS | macOS (Darwin 25.6.0) |
| Node.js / npm | v24.22.0 / 12.2.0 |
| Playwright / TypeScript | 1.61.1 / 7.0.2 |
| Shell variables | `APP_ENV`, `BASE_URL`, and `LOCAL_SANDBOX_DIR` all unset |
| Target | `dev`, https://dev.ai-orchestration-courses.com |
| Playwright config | One project (`chromium`), `retries: 0`, traces kept on failure |

`npm test` sets `APP_ENV=dev` itself. `npx playwright test --list` selected dev because `APP_ENV` was unset.

### Results
Run one at a time, in this order, on 2026-11-05 (CST):

| Started | Command | Exit | Result |
|---|---|---|---|
| 21:52:38 | `npm run typecheck` | 0 | No errors |
| 21:52:43 | `npm run test:safety` | 0 | 108 tests, 108 passed, 0 failed, 0 skipped |
| 21:52:48 | `npx playwright test --list` | 0 | `Total: 3 tests in 2 files`, all `[chromium]` |
| 21:52:52 | `npm test -- --reporter=list` | 0 | `3 passed (1.7s)`, 0 failed, 0 skipped, no retries |

Browser tests that passed:
1. `tests/blog/home.smoke.spec.ts` › Blog home smoke › banner identifies the development site
2. `tests/blog/home.smoke.spec.ts` › Blog home smoke › article list shows at least one article card
3. `tests/blog/categories.smoke.spec.ts` › Blog categories smoke › signed-in author sees the category list with an item

The categories test signs in with the course's fictional training account. Its values are only in `tests/support/users.ts` and are not recorded here.

### Branch
| Step | Command | Result |
|---|---|---|
| Create | `git switch -c week-2` | Created from `b77e43e` |
| Publish | `git push -u origin week-2` | New branch on GitHub, tracking `origin/week-2` |
| Confirm | `git branch --show-current` | `week-2` |

### Not verified here
- **Pull request #1 review:** its review and approval were not checked. A merge commit doesn't record approvals, and the GitHub CLI isn't installed.
- **Production:** no prod run was part of this baseline.

## 2026-11-05: Jira seed import

**Source:** the import results and opened items below were reported by the framework owner. They were not observed or checked in Jira for this record. The cross-check section was done offline against the seed package only.

### Seed package
| Item | Value |
|---|---|
| Version (`version` in `jira-seed/jira-seed.json`) | `2026-09-16` |
| Import script | `scripts/jira-seed.mjs` |
| Credentials | Root `.env`, ignored and untracked (`git check-ignore .env` prints `.env`; `git ls-files .env` prints nothing). Contents not recorded. |

### Reported import result
| Item | Result |
|---|---|
| Jira project | Agentic QA (`SCRUM`), team-managed |
| Outcome | Import completed successfully |
| Created | 158 work items: 7 epics, 30 tasks, 121 subtasks |
| Reused | 0 |
| Keys | All match the course: `SCRUM-5` through `SCRUM-162` |
| Key map | None generated, so `vault/sources/jira/key-map.md` does not exist |

Import success output, as reported:

```text
created 158, reused 0, placeholders 0, API calls 161
ok: all 158 keys match the course (SCRUM-5..SCRUM-162)
```

### Offline cross-check against the seed package
| Check | Result |
|---|---|
| Items in `jira-seed.json` | 158: 7 epics, 30 tasks, 121 subtasks, matching the reported counts |
| Course keys in `jira-seed.json` | `SCRUM-5` through `SCRUM-162`, all unique, matching the reported range |
| Key map file | Not present in the repository |

### Reported opened items
Summaries are quoted from `jira-seed.json`.

| Key | Summary |
|---|---|
| `SCRUM-9` | Automate environment & navigation smoke (UI) |
| `SCRUM-108` | TC-UI-001 — Environment banner shows DEVELOPMENT on the dev target |
| `SCRUM-109` | TC-UI-003 — Anonymous nav shows login; authed links are absent |
| `SCRUM-110` | TC-UI-004 — Authenticated nav shows dashboard/categories/account/logout; login absent |

### Selected test case
**TC-UI-001 (`SCRUM-108`)** verifies that the environment banner displays DEVELOPMENT when the application runs in the development environment.

- **Existing coverage:** `tests/blog/home.smoke.spec.ts` › Blog home smoke › banner identifies the development site. It asserts that `env-banner` is visible and contains `DEVELOPMENT`, and it runs on dev only through `runIfEnv(test, ['dev'])`. It passed in the starting baseline above.
- **Difference from the course description:** the seed description for `SCRUM-108` names `tests/blog/ui/ui-smoke.spec.ts` and says the test runs on dev and prod, with banner text differing by `APP_ENV`. This framework covers the dev case only.

### Week 3 database access
**SENT:** database access was requested from the mentor. No reply confirmed as of 2026-11-05.
