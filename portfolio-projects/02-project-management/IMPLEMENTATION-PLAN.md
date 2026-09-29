# Implementation plan and risk log

1. Reproducible workspace, strict checks, schema, deterministic identity seed.
2. Tenant/project authorization vertical slice through React→API→domain→SQL.
3. Transactional task edit/move, stable ordering, WIP, activity, idempotency.
4. Search/views/collaboration, attachment/notification/webhook adapters and worker.
5. Hostile tests, operations/security documents, build/start verification.

Highest risks are an omitted tenant predicate, stale guest/session permissions, concurrent WIP bypass, rank exhaustion, and dishonest optimistic UI. Evidence maps to isolation, cache generation, forced move, idempotency/version, and component tests. AI assistance level is 3 for implementation; independent oracles are the SQL constraints, hostile HTTP requests, invariant counts, clean migration, and production build. Scope intentionally does not claim hosted authentication, binary storage, or real outbound delivery.
