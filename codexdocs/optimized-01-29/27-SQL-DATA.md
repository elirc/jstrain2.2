# 27 — SQL data

## Outcome

Protect durable invariants with transactions and constraints, implement stable
pagination, design schemas deliberately, and evolve them through recoverable
migrations.

## The 80/20 model

Database constraints arbitrate invariants across concurrent processes. Use
primary/foreign keys, uniqueness, non-null, and checks where the invariant is
durable. Application validation improves feedback but cannot replace the
authoritative constraint.

A transaction groups one business action. Keep external network calls outside
database transactions; persist intent atomically and deliver later. Handle
constraint conflicts as expected outcomes when appropriate.

Keyset pagination uses stable ordered values and a unique tiebreaker. Schema
design begins with entities, relationships, cardinality, ownership, and query
patterns. Migrations must handle blank and existing data, partial failure,
version overlap, and restart.

## Common traps

- Check-then-insert race without unique constraint.
- Transaction commit in catch/finally path.
- Offset pagination degrading/skipping under change.
- Nullable columns used instead of modeling rollout.
- Migration marked complete before commit.
- Constraint errors exposed as raw database messages.

## Optimized exercises

1. **Atomicity:** write comment plus activity in a transaction; force second
   write failure and prove neither persists using a real database.
2. **Pagination:** implement descending `(created_at, id)` keyset pagination,
   including tied values, invalid cursors, insertion, and deletion.
3. **Application:** add a RelayDesk schema change through expand/backfill/
   enforce/contract phases with blank, upgrade, repeat, and recovery tests.

## Exit gate

State which invariants the database owns, exact transaction boundary, expected
concurrency behavior, and safe migration/rollback path.

More reps: `../../bootcamp/27-sql-data/`.

