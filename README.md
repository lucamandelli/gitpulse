# GitPulse

AI-powered GitHub repository monitor. Connect your GitHub account, pick the repositories you care about, and get what happened in them summarized in plain language: commits, pull requests and more.

> **Status: work in progress.** Authentication, repository management and the test setup are in place. LLM summaries and real-time notifications are next.

## Built with an agentic workflow

GitPulse is also my playground for building software with AI agents in the loop. Development runs on [Claude Code](https://claude.com/claude-code) with custom skills that live in this repo:

- **[`pr-review-cycle`](.claude/skills/pr-review-cycle/SKILL.md)**: once a feature is done, the agent opens the PR, requests a review from `@claude`, polls for feedback, addresses or pushes back on comments, waits for CI and merges.
- **[`documenting-merged-prs`](.claude/skills/documenting-merged-prs/SKILL.md)**: after a merge, the agent writes a technical record on the related issue (decisions, problems found, trade-offs) and opens new issues for anything out of scope.
- **[`CLAUDE.md`](CLAUDE.md)**: project rules the agent follows, like atomic commits, feature branches into `develop`, checking up-to-date docs through Context7 before coding, and requiring integration tests for every API route.

Features start as a design spec with HTML mockups ([example](docs/superpowers/specs/2026-04-15-dashboard-repositories-design.md)), then go through planning, implementation and the review cycle above.

## Tech stack

| Area     | Tools                                                             |
| -------- | ----------------------------------------------------------------- |
| Frontend | React 19, Vite, Tailwind CSS 4                                    |
| Backend  | Node.js, Fastify 5, TypeScript, Zod                               |
| Auth     | Better Auth with GitHub OAuth                                     |
| Data     | PostgreSQL 16, Drizzle ORM                                        |
| Testing  | Vitest, MSW (GitHub API mocks), real Postgres in a test container |
| Infra    | Docker Compose, GitHub Actions                                    |

## Roadmap

- [x] Monorepo setup with Docker Compose (web, api, postgres)
- [x] GitHub OAuth login
- [x] Add, list and remove monitored repositories through the GitHub API
- [x] Integration tests and CI with coverage reports
- [ ] Dashboard with repository cards
- [ ] LLM summaries of commits and pull requests
- [ ] Real-time notifications via WebSocket

## Project structure

```
apps/
├── api/    Fastify API (auth, repositories, GitHub integration)
└── web/    React frontend
docs/       Design specs and mockups
.claude/    Claude Code skills used in development
```

## Running locally

Requirements: Docker and a [GitHub OAuth app](https://github.com/settings/developers) with callback URL `http://localhost:3333/api/auth/callback/github`.

```bash
cp .env.example .env   # fill in BETTER_AUTH_SECRET, GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET
docker compose up
```

- Web: http://localhost:3000
- API: http://localhost:3333

### Tests

```bash
docker compose --profile test up -d postgres-test
cd apps/api && npm test
```
