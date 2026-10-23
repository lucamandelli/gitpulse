# GitPulse agent instructions

## Workflow

The project follows the [agent-skills](https://github.com/addyosmani/agent-skills) lifecycle: spec, plan, build, test, review, ship.

- Spec: `SPEC.md`, a living document updated in place as decisions change.
- Plan: `tasks/plan.md`, the plan for the current milestone. Replaced when the next milestone starts.
- Tasks: GitHub Issues, as sub-issues of the milestone epic. A task is done when the PR that closes its issue is merged.
- Before implementing a task, read `SPEC.md`, `tasks/plan.md` and the task's issue.
- Read `CONSTRAINTS.md` before writing code. Do not weaken it to make a change pass.
- Vision and roadmap: the GitPulse GitHub Project README. Architecture decisions: `docs/adr/`.

## Planning

Plan tasks so they can run in parallel: keep dependencies to the minimum and avoid tasks that touch the same files.

## Git

- `main` is the only long-lived branch. Never commit directly to it.
- Branch off `main` and open PRs back into `main`.
- Atomic commits using Conventional Commits.

## Language

Code, docs, commits, issues and PRs in English.
