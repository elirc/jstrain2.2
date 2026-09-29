# 19 — Node persistence mastery bank

Deepen: files, durability, concurrency, repositories, transactions, schemas, migrations, and recovery.

## Explain

- [ ] Explain atomicity, durability, consistency, and isolation using concrete failure windows.
- [ ] Explain temp-write-plus-rename, including what it does and does not guarantee.
- [ ] Explain lost updates, optimistic concurrency, locks, and transaction isolation choices.
- [ ] Explain why domain code should depend on repository behavior rather than storage details.
- [ ] Explain forward/backward-compatible database migrations during rolling deployment.

## Predict

- [ ] Predict disk state after crashes before write, during flush, after rename, and during cleanup.
- [ ] Predict outcomes when two processes read-modify-write the same JSON file concurrently.
- [ ] Predict replay results for duplicate, truncated, and out-of-order append-log records.
- [ ] Predict database state when an error occurs at each step of a multi-write transaction.
- [ ] Predict old/new application behavior while nullable, backfilled, and constrained schema phases overlap.

## Implement

- [ ] Build deterministic serialization and atomic file replacement with permissions preserved.
- [ ] Build an append-only event log with checksums, replay, truncation detection, and compaction.
- [ ] Build a lock or compare-and-swap mechanism with stale-owner recovery and clear limits.
- [ ] Define a typed repository contract and implement both in-memory and durable adapters.
- [ ] Implement a transactional SQLite feature with constraints, indexes, prepared queries, and migrations.

## Test

- [ ] Inject failures at persistence boundaries and assert old or new state, never silent corruption.
- [ ] Test concurrent writers and prove the selected conflict behavior under repetition.
- [ ] Test log replay with duplicates, invalid checksums, partial tails, and interrupted compaction.
- [ ] Run repository contract tests against every adapter to prevent semantic drift.
- [ ] Test migrations from realistic old fixtures, repeat execution, rollback strategy, and mixed versions.

## Debug and review

- [ ] Recover a truncated JSON store and explain which data can and cannot be trusted.
- [ ] Diagnose a lost-update bug from interleaved requests and add a regression test.
- [ ] Repair transaction code that commits partial state because one awaited operation escaped scope.
- [ ] Review queries for injection, N+1 access, missing indexes, unstable ordering, and unbounded results.
- [ ] Diagnose a migration that passes empty databases but fails realistic production data.

## Apply

- [ ] Add durable RelayDesk tickets behind a repository without changing the HTTP contract.
- [ ] Add optimistic concurrency with versioned updates and an explicit conflict response.
- [ ] Design an expand/backfill/contract migration for a new required ticket field.
- [ ] Write backup, restore, integrity-check, and disaster-recovery instructions and rehearse them.
- [ ] Present a persistence decision record comparing file, SQLite, and service-database options.
