# GitPulse agent instructions

## Where things live

- Vision and roadmap: the GitPulse GitHub Project README.
- Milestone specs: the body of each milestone's epic issue. Tickets are its sub-issues.
- In the repo, only docs that stay true while the code doesn't change: `README.md`, `docs/adr/` and this file. Do not commit plans, specs or other work-in-progress docs.

## Git

- Never commit directly to `main` or `develop`. Branch off `develop`.
- PRs from feature branches target `develop`. `main` only reflects what is in production.
- Atomic commits using Conventional Commits.

## Language

Code, docs, commits, issues and PRs in English.
