# Portfolio projects execution plan

## Delivery sequence

1. Establish three independent npm workspaces with the required application, package, migration, test, CI, and documentation boundaries.
2. Complete one end-to-end vertical slice in each project: React UI to validated HTTP API to domain command to SQL repository and audit history.
3. Implement each domain's highest-risk invariant and prove it with deterministic tests: last-unit reservation, WIP-limited movement, and last-slot booking.
4. Add state transitions, idempotency, filtering/sorting/pagination, background jobs, retry/dead-letter behavior, and operational endpoints.
5. Add accessible user workflows, failure/conflict states, deterministic seed data, and local demo accounts.
6. Verify clean migration and seed, typecheck, lint, unit/integration/React/concurrency/migration/smoke tests, production build, API startup, and worker startup.
7. Review the complete diff for tenant boundaries, authorization, transaction rollback, unchecked input, accidental scope changes, and documentation accuracy.

## Highest-risk decisions

| Risk | Decision and proof target |
| --- | --- |
| Overselling inventory | Reserve through a transactional named command with a durable idempotency key and a deterministic final-unit race test. |
| Tenant data leakage | Derive organization scope from authenticated membership on the server and exercise cross-tenant negative tests and cache switching. |
| WIP and rank races | Enforce the WIP check and task move together, require a version, and prove concurrent moves cannot exceed the limit. |
| Appointment overlap | Allocate the complete buffered resource interval atomically and prove only one simultaneous confirmation succeeds. |
| Civil-time ambiguity | Persist UTC instants plus IANA zones; reject DST gaps and require explicit disambiguation for repeated times. |
| Half-applied commands | Put state, projections, immutable audit/ledger records, and idempotency records in one SQL transaction; inject failures in tests. |
| Duplicate background effects | Use durable job keys, bounded retries, visible dead letters, and operator replay commands. |
| Environment portability | Use local SQLite behind repository boundaries for this release candidate; document PostgreSQL limitations and migration work honestly. |

## Review gates

Every project is reviewed against the same widening ladder: static checks, focused domain tests, package tests, real SQL/API integration tests, production build, clean migration/seed, smoke test, and process startup/shutdown. A dashboard entry is only marked complete when its evidence exists in the project.

## AI assistance record

This delivery uses AI assistance level 3 for implementation. Requirements, cross-project quality gates, security acceptance, and final review remain centralized. The course requirement for later learner-completed Level 0 work is not represented as completed by this generated release.
