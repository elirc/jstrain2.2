# 27 — SQL and data mastery bank

Deepen: modeling, constraints, transactions, queries, indexes, migrations, pagination, concurrency, and operational data safety.

## Explain

- [ ] Explain tables, keys, constraints, normalization, and denormalization through invariants they enforce.
- [ ] Explain transaction atomicity and isolation using two concurrent business operations.
- [ ] Explain indexes as ordered auxiliary structures with read, write, storage, and maintenance costs.
- [ ] Explain offset versus cursor pagination and the need for a total deterministic order.
- [ ] Explain schema migration compatibility across application versions and existing dirty data.

## Predict

- [ ] Predict which invalid states are blocked by type, nullability, check, unique, and foreign-key constraints.
- [ ] Predict results under concurrent reads and writes for a selected isolation or optimistic-lock strategy.
- [ ] Predict whether five query shapes can use a supplied single or composite index efficiently.
- [ ] Predict page duplication or omission after inserts when using offset and cursor pagination.
- [ ] Predict application behavior at each phase of an expand/backfill/contract migration.

## Implement

- [ ] Model users, tickets, comments, assignments, and tags with explicit cardinality and constraints.
- [ ] Write parameterized create, update, filtered list, aggregate, and delete queries with stable contracts.
- [ ] Implement a transaction that preserves a cross-table domain invariant under failure.
- [ ] Add optimistic concurrency using a version field and conditional update semantics.
- [ ] Implement cursor pagination with a composite cursor and deterministic tie-breaking.

## Test

- [ ] Seed minimal fixtures covering empty, null, duplicate, orphan-attempt, boundary, and skewed cases.
- [ ] Test constraints directly and assert the application translates violations into useful domain errors.
- [ ] Test two concurrent operations and prove either serialization, conflict, or safe commutativity.
- [ ] Test query correctness and plans on realistic data volume and distribution.
- [ ] Test a migration from multiple historical fixtures, including interrupted and repeated execution.

## Debug and review

- [ ] Diagnose a slow query from plan evidence rather than adding indexes speculatively.
- [ ] Repair an N+1 query and verify both result equivalence and bounded database calls.
- [ ] Diagnose lost updates and choose pessimistic locking, optimistic conflict, or atomic SQL intentionally.
- [ ] Review deletion behavior for restriction, cascade, soft delete, restoration, and audit requirements.
- [ ] Repair unstable pagination caused by nonunique sorting and changing datasets.

## Apply

- [ ] Build the RelayDesk data layer behind repository interfaces and contract-test it.
- [ ] Add a safe, filterable ticket report with joins, aggregates, limits, and justified indexes.
- [ ] Design a zero-downtime migration for a required field and specify rollback at every phase.
- [ ] Produce backup, restore, retention, privacy-deletion, and integrity-verification procedures.
- [ ] Defend the data model using invariants, workload, scale assumptions, concurrency, and future change.
