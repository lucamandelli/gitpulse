# Constraints

Last reviewed: 2026-10-23 by @lucamandelli

The quality bar for GitPulse. Every check below blocks: a failing check stops the task, there are no warn-only checks. Several agents work in parallel without supervision, and a warning nobody reads is not a check.

This file is the source of truth. The `check:*` scripts mirror it; if they drift, this file wins. Changes to this file go in their own commit, never in the same commit as a change that was failing.

## Floor

Checked by `node scripts/floor-guard.mjs --base origin/main` at task end and in CI. It reads only the diff.

- No new suppression comments: `@ts-ignore`, `@ts-nocheck`, `eslint-disable`, `istanbul ignore`, `nosemgrep`, `gitleaks:allow`. A suppression switches off a check this file relies on; a genuine case goes through the Exceptions table.
- No unfinished work: stubs that throw "not implemented", empty `catch` blocks, `TODO` comments. Unfinished work merged looks finished.
- No skipped, deleted or weakened tests: no `.skip`/`.todo`, no deleted test files, no assertions removed from tests that stay. Making a test easier is the cheapest road to green.
- No secrets in source.
- This file is never weakened to make a change pass: no lowered threshold, no removed rule, no new exception without review.

## Enforced with numbers

| Dimension | Rule | Why | Checked by | Runs at | Wired in |
|---|---|---|---|---|---|
| Types | Zero errors, `strict` on | Types are the cheapest proof the code fits together | `pnpm typecheck` | every edit | #32 |
| Lint | Zero ESLint errors | One shared config keeps parallel agents' code consistent | `pnpm lint` | every edit | #32 |
| Format | Zero Prettier differences | Diffs show behavior changes, not whitespace | `pnpm format:check` | every edit | #32 |
| Secrets | Zero findings | A leaked key is public forever on a public repo | `gitleaks git --redact --no-banner` | every edit, CI | #32, #34 |
| Coverage: changed lines | ≥ 80% of changed lines in `apps/*/src` covered | High enough to force a test for new code, low enough to allow config lines | `diff-cover coverage/lcov.info --compare-branch=origin/main --fail-under=80` | task end, CI | #34 |
| Coverage: API project | ≥ 80% lines in `apps/api/src`, excluding `main.ts` and `instrumentation.ts` | The repo starts empty, so the bar can hold from the first commit | `pnpm --filter api test:coverage` (Vitest thresholds) | task end, CI | #34 |
| Architecture | Zero dependency-cruiser violations | Module boundaries rot one shortcut import at a time | `pnpm check:boundaries` | task end, CI | #37 |
| Security: code | Zero high or critical findings | External rule set, independent of our own tests | `semgrep scan --config p/default --config p/owasp-top-ten --error` | CI | #34 |
| Security: dependencies | Nothing at high or above | Below high is mostly noise | `osv-scanner scan source -r .` | CI | #34 |
| Accessibility | Zero critical or serious WCAG 2.1 AA violations on every E2E page | Moderate and minor findings are often debatable | `@axe-core/playwright` inside `pnpm test:e2e` | CI | #41 |

Secrets, dependencies, code scanning and accessibility are judged by external rule sets, so they hold even when the agent wrote both the code and the tests.

## Review rules

Checked at review with `/review` against the diff, because no tool can judge them.

- Every new or changed API route ships with integration tests against real Postgres and Redis.
- Every user-facing flow added or changed is covered by an E2E test.

## Check stages

| Script | Runs | Budget |
|---|---|---|
| `check:fast` | types, lint and format on changed files, gitleaks | under 5 s |
| `check:task` | `check:fast`, floor guard, related tests with coverage, changed-lines coverage, boundaries | under 90 s |
| `check:full` | everything above on the whole repo, Semgrep, osv-scanner, E2E with axe | CI, no limit |

Integration tests start Postgres and Redis with Testcontainers, so `check:task` runs only the tests related to the change. The full suite runs in CI.

## Measured, not yet enforced

None. The repo starts empty, so every dimension is enforced from the first commit instead of held at a measured value.

## Deferred

| Dimension | Planned rule | Tool | Starts | Why deferred |
|---|---|---|---|---|
| Performance: page | LCP ≤ 2500 ms, CLS ≤ 0.1 | Lighthouse against the E2E stack | M1 | M0 only has the sign in page, so a budget would measure nothing |
| Performance: bundle | Measure the main bundle at the start of M1, then it must not grow without a reason | size-limit | M1 | Same as above |

## Exceptions

Default lifetime 90 days. Every exception needs an owner and an expiry date.

| ID | Rule | Path | Reason | Owner | Expires |
|---|---|---|---|---|---|
