# Implementation Plan: M0 Foundation

## Overview
Build the walking skeleton described in [`SPEC.md`](../SPEC.md): GitHub sign in end to end in production, CI gating every PR, automatic deploys on merge to `main`, and logs, metrics and traces in Grafana Cloud.

Tasks are tracked in GitHub Issues as sub-issues of the M0 epic [#31](https://github.com/lucamandelli/gitpulse/issues/31), in the "M0 Foundation" milestone. A task is done when the PR that closes its issue is merged.

## Architecture Decisions
- NestJS modular monolith. Boundaries enforced by dependency-cruiser in CI; hexagonal only where there are real adapters.
- Same origin through Caddy: SPA on `/`, API on `/api`. No CORS, no cross-site cookies for Better Auth.
- Better Auth through the community `@thallesp/nestjs-better-auth` integration on the Express adapter. Fastify support is still beta.
- Drizzle ORM, Postgres 17 on the `pgvector/pgvector` image so M4 needs no image change.
- Grafana Cloud free tier for logs, metrics and traces, fed by Grafana Alloy, to keep the VPS small.
- Hostinger KVM 2 to start, measured and right-sized after the first deploy.

## Task List
Tasks in the same wave can run in parallel. Dependencies are also set as native "blocked by" links on the issues.

| Wave | Tasks |
|---|---|
| 1 | [#47](https://github.com/lucamandelli/gitpulse/issues/47) research: treehouse, [#43](https://github.com/lucamandelli/gitpulse/issues/43) VPS and domain |
| 2 | [#32](https://github.com/lucamandelli/gitpulse/issues/32) pnpm monorepo |
| 3 | [#33](https://github.com/lucamandelli/gitpulse/issues/33) NestJS API |
| 4 | [#34](https://github.com/lucamandelli/gitpulse/issues/34) CI |
| 5 | [#35](https://github.com/lucamandelli/gitpulse/issues/35) Postgres, Redis, readiness, [#37](https://github.com/lucamandelli/gitpulse/issues/37) module boundaries, [#38](https://github.com/lucamandelli/gitpulse/issues/38) web app, [#49](https://github.com/lucamandelli/gitpulse/issues/49) research: no-mistakes |
| 6 | [#36](https://github.com/lucamandelli/gitpulse/issues/36) API sign in, [#40](https://github.com/lucamandelli/gitpulse/issues/40) containers and Caddy, [#42](https://github.com/lucamandelli/gitpulse/issues/42) observability |
| 7 | [#39](https://github.com/lucamandelli/gitpulse/issues/39) web sign in |
| 8 | [#41](https://github.com/lucamandelli/gitpulse/issues/41) E2E, [#48](https://github.com/lucamandelli/gitpulse/issues/48) research: verification skills |
| 9 | [#44](https://github.com/lucamandelli/gitpulse/issues/44) deploy on merge |
| 10 | [#45](https://github.com/lucamandelli/gitpulse/issues/45) right-size the VPS, [#46](https://github.com/lucamandelli/gitpulse/issues/46) README |

### Checkpoint A: after #47 and #32-#35
- [ ] API runs locally with live and ready health checks
- [ ] CI green on `main`, coverage gate active

### Checkpoint B: after #36-#39
- [ ] GitHub sign in and sign out work end to end locally
- [ ] Module boundaries enforced in CI

### Checkpoint C: after #40-#42
- [ ] Production-like stack runs locally behind Caddy
- [ ] E2E green in CI
- [ ] A request's trace, logs and metrics show up in Grafana Cloud

### Checkpoint D: after #43-#46
- [ ] Every success criterion in `SPEC.md` is met in production
- [ ] Review with the owner before starting M1

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| The community Better Auth integration breaks or misses something | High | Done early (#36). Fallback: mount the Better Auth handler on Express directly |
| OTel pino instrumentation does not support the current pino version | Medium | Pin a supported version or inject the trace id in a custom formatter |
| Testcontainers slow or flaky in CI | Medium | Reuse containers per suite, keep integration in its own job |
| The 80% coverage gate blocks early work with little code | Low | Gate covers `apps/api/src` only, excluding `main.ts` and `instrumentation.ts` |

## Open Questions
- None blocking. The domain is bought in #43.
