# Risk-based test strategy

Unit tests cover pure permission, quantity, state, and retry rules. Repository tests use real SQLite constraints/triggers/transactions. HTTP tests bind a real ephemeral socket to prove parsing, authentication, authorization, correlation, and serialization. React Testing Library checks accessible names and role-aware outcomes. Deterministic concurrency schedules two microtasks against one serialized connection and asserts the database outcome, not timing. Migration is applied blank and twice. Worker tests make clocks available explicitly through persisted timestamps.

The five release risks map to `concurrency.test.ts`, `rollback.test.ts`, `authorization.test.ts`, `integration.test.ts`, and `worker.test.ts`. Current gap: the concurrency test proves the chosen single-process SQLite policy, not cross-process PostgreSQL locking. A future load test should measure 95th percentile stock listing and 20 concurrent reservations against PostgreSQL.
