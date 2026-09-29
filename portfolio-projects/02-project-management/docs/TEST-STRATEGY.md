# Risk-based verification

| Risk | Evidence |
| --- | --- |
| Tenant/guest data exposure | Real HTTP cross-tenant denial and repository-scoped board/search tests |
| WIP race / lost update | Deterministic sequentialized transaction contenders and optimistic stale edit test |
| Stale browser cache after switch | Deferred old response rejected by client generation test; component clears previous board |
| Duplicate move/delivery | Durable idempotency response equality; unique job/webhook keys |
| Partial multi-write | SQLite transaction boundaries; migration blank/repeat test |
| Worker poison input | Bounded exponential retry, fifth-attempt dead state; scan/webhook integration tests |

`npm run check` widens from static checks to all Vitest boundaries and the production build. The integration suite uses a real SQLite database and real listening HTTP server. The concurrency test is deterministic rather than timing-dependent: each contender executes against the same immediate-write transaction boundary and asserts the invariant after both outcomes.

Performance hypothesis: the compound `(org_id, project_id, column_id, rank, id)` index keeps the normal board scan bounded by one tenant/project. `EXPLAIN QUERY PLAN` should show the tenant index. The current `%LIKE%` title search cannot use a B-tree efficiently; migrate to FTS5/PostgreSQL full-text search when p95 on a 100k-task tenant exceeds 200 ms.
