# Spec: M0 Foundation

## Objective
A walking skeleton that every later milestone builds on. A visitor opens the production URL, signs in with GitHub, sees their name and avatar, and signs out. Every merge to `main` ships to production automatically, and the owner can see logs, metrics and traces for any request.

Acceptance:
- A visitor can sign in with GitHub and lands on an authenticated page with their name and avatar.
- A signed-in user can sign out, and the session is gone after a reload.
- Protected API routes return 401 without a session.
- A merge to `main` is live in production with no manual steps.
- For any request, logs, metrics and a trace can be found and correlated by trace id.

## Tech Stack
- Node 24 LTS, TypeScript strict, pnpm workspaces
- API: NestJS 11 (Express adapter), Drizzle ORM + drizzle-kit, Better Auth with the GitHub provider through `@thallesp/nestjs-better-auth`, zod for env validation, nestjs-pino, OpenTelemetry Node SDK with auto-instrumentations
- Data: Postgres 17 (`pgvector/pgvector` image, so M4 needs no image change), Redis
- Web: React 19, Vite, React Router v7, TanStack Query, Tailwind CSS 4
- Quality: ESLint + typescript-eslint, Prettier, dependency-cruiser
- Tests: Vitest (+ unplugin-swc for Nest), Supertest, Testcontainers, Testing Library, Playwright
- Infra: Docker Compose, Caddy (reverse proxy + automatic TLS), GitHub Actions, GHCR, one VPS, starting on Hostinger KVM 2 (2 vCPU, 8 GB) and right-sized after measuring real usage
- Observability: Grafana Cloud free tier for logs, metrics and traces, fed by Grafana Alloy running on the VPS
- Versions are pinned at implementation time after checking current docs.

## Commands
Run from the repo root.
```
pnpm install
pnpm dev                        # Postgres + Redis in Docker, api and web in watch mode
pnpm build
pnpm lint
pnpm format:check
pnpm typecheck
pnpm check:boundaries           # dependency-cruiser module rules
pnpm test                       # unit + integration (Testcontainers, needs Docker)
pnpm test:coverage
pnpm test:e2e                   # Playwright against the full Compose stack
pnpm --filter api db:generate   # drizzle-kit generate
pnpm --filter api db:migrate
docker compose up -d            # production-like stack locally
```

## Project Structure
```
apps/api/src/
  instrumentation.ts            OpenTelemetry SDK, loaded before anything else
  main.ts
  app.module.ts
  modules/
    health/                     liveness and readiness
    auth/                       Better Auth, owns user/session/account tables, GET /api/me
  shared/
    config/                     env schema (zod), validated at boot
    database/                   Drizzle client, schema aggregation
    observability/              logger and OTel helpers
apps/api/migrations/            drizzle-kit output
apps/api/test/integration/      *.int-spec.ts
apps/web/src/
  app/                          router, providers, layout
  features/<feature>/           auth, ...
  shared/                       api client, ui primitives
e2e/                            Playwright specs
infra/caddy/Caddyfile
infra/alloy/                    collector config
docs/adr/                       architecture decision records
SPEC.md                         this spec
tasks/plan.md                   current implementation plan
.github/workflows/              ci.yml, deploy.yml
docker-compose.yml
```

Module rules, enforced by dependency-cruiser in CI:
- Code outside `modules/<name>/` may only import `modules/<name>/<name>.module.ts` and the types it re-exports.
- A module never reads or writes another module's tables. Each module owns its Drizzle schema file.
- `shared/` never imports from `modules/`.

## Code Style
```ts
// modules/auth/auth.module.ts: the only file other modules may import
@Module({
  controllers: [MeController],
  providers: [CurrentUserService],
  exports: [CurrentUserService],
})
export class AuthModule {}

// modules/auth/me.controller.ts
@Controller('me')
export class MeController {
  constructor(private readonly currentUser: CurrentUserService) {}

  @Get()
  me(@Session() session: UserSession) {
    return this.currentUser.toProfile(session.user)
  }
}
```
- Kebab-case file names with Nest suffixes (`me.controller.ts`, `auth.module.ts`).
- Named exports only. No `any`.
- Env is read only through the validated config, never `process.env` directly.
- Prettier: single quotes, no semicolons, 100 columns.
- Logs go through the injected logger, never `console`.

## Testing Strategy
- Unit: Vitest, colocated `*.spec.ts`, for logic without I/O.
- API integration: Nest testing module + Supertest against real Postgres and Redis started by Testcontainers. Every new or changed route ships with integration tests. Sessions are created through factories, never through real GitHub.
- Web: Vitest + Testing Library for components with logic.
- E2E: Playwright against the Compose stack: unauthenticated visitor sees the login screen, a seeded session sees name and avatar, sign out works.
- Coverage: reported on every PR. Gates at 80% of changed lines and 80% of `apps/api/src` lines, as defined in `CONSTRAINTS.md`.
- Production: the deploy workflow fails if `/api/health/ready` is not 200 after rollout.

## Boundaries
- Always: tests for every new or changed route; lint, format, typecheck, boundaries and tests green before pushing; Conventional Commits; English everywhere; schema changes through `drizzle-kit generate`; secrets only in env files ignored by git and in GitHub secrets.
- Ask first: new dependencies; schema changes; changes to CI or deploy workflows; loosening a dependency-cruiser rule or the coverage gate; infra changes (ports, volumes, VPS).
- Never: commit secrets or `.env`; import another module's internals; touch another module's tables; skip or delete failing tests; push to `main` directly; add suppression comments or otherwise lower the bar in `CONSTRAINTS.md`.

## Success Criteria
1. The production domain serves the SPA over HTTPS with a valid certificate, and HTTP redirects to HTTPS.
2. GitHub sign in works in production, the session survives a reload, and sign out clears it.
3. `GET /api/me` returns 401 without a session and the user profile with one.
4. `GET /api/health/live` returns 200. `GET /api/health/ready` returns 200 only when Postgres and Redis are reachable, 503 otherwise. Both covered by integration tests.
5. Every PR runs lint, format check, typecheck, boundaries, unit + integration with coverage, and E2E. `main` requires a PR with all checks green.
6. A merge to `main` builds images, pushes them to GHCR, runs migrations, deploys to the VPS and passes the readiness check, with no manual steps.
7. Logs are JSON with request id and trace id. A trace for an HTTP request shows spans for Nest, Postgres and Redis. Rate, errors and duration per route are visible as metrics. All of it is in Grafana Cloud.
8. A fresh clone runs locally with `pnpm install && pnpm dev`, following the README.
9. Memory and CPU of the production stack are measured after the first deploy, and the VPS plan is downsized if a smaller one fits with headroom.
10. ADRs exist for: modular monolith with enforced boundaries, Drizzle, same origin through Caddy, pnpm workspaces, observability stack.

## Decisions
- UI uses Tailwind only, no component library.
- The domain is bought during the deploy ticket.
- Postgres backups are out of M0. M0 only stores users and sessions, which come back on the next login. Backups (likely nightly `pg_dump` to Cloudflare R2) are reconsidered in M1, once ingested data and summaries cost LLM money to regenerate.
