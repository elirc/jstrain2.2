# Module 05 — SQL and data integrity

Pair with: RelayDesk increments 4, 10, and 11.

## Why this matters

Application checks improve user feedback; database constraints protect data
when multiple code paths and requests act concurrently. Mid-level data work
means understanding both layers and knowing which invariant must survive
process crashes, retries, deployments, and races.

## Model invariants before tables

Examples:

- IDs uniquely identify rows.
- A ticket belongs to exactly one workspace.
- A comment belongs to an existing ticket and author.
- Webhook idempotency keys are unique within the intended scope.
- A ticket update with stale version must not overwrite a newer version.

Turn durable invariants into primary keys, foreign keys, unique constraints,
checks, non-null columns, and transaction boundaries. Do not rely only on a
service method that future scripts or endpoints may bypass.

## Transactions protect one business action

A transaction groups database changes into one atomic outcome. It does not
automatically make an external HTTP call atomic with the database. For that,
record durable intent inside the transaction and deliver later—an outbox-like
pattern—rather than holding a database transaction open across the network.

## Concurrency invalidates check-then-write assumptions

This is unsafe when uniqueness matters:

```text
SELECT to see whether key exists
if absent, INSERT
```

Two requests can both observe absence. A unique constraint is the arbiter;
the application interprets its conflict. Similar reasoning applies to version
checks, counters, and inventory-like state.

## Migrations are production code

A migration must work for a blank database and for the previous deployed
schema with existing data. Separate expand, backfill, and contract phases when
a single blocking change is risky. Record completion only after success.

## Query performance is measured

Start from the slow request, capture query count/timing, inspect the plan, and
change the demonstrated bottleneck. An index helps only if its columns/order
support the actual predicate and ordering. Every index also costs storage and
write work.

## Common failure patterns

- String-interpolated SQL.
- Missing foreign-key enforcement.
- Check-then-insert without a unique constraint.
- Transaction code that commits in an error path.
- Offset pagination over a large/changing table.
- `LEFT JOIN` accidentally changed into an inner join by a `WHERE` predicate.
- Aggregate fan-out that double-counts joined child rows.
- Migration marked applied before statements complete.
- N+1 queries hidden behind convenient repository methods.

## Exercise 1 — invariant-to-constraint map (core)

Write ten RelayDesk invariants. For each, choose database constraint,
transaction, application validation, authorization policy, or multiple
mechanisms.

Constraints:

- Include uniqueness, ownership, lifecycle, idempotency, and immutable audit.
- State which layer gives friendly feedback and which is authoritative.
- Identify one invariant the database alone cannot understand.

Proof: table with failure scenario and enforcement evidence.

Debrief: which invariant would be lost if a future maintenance script bypassed
the service layer?

AI level: 1 after your first map.

## Exercise 2 — transaction under forced failure (core)

Insert a comment and activity record atomically. Force failure after the first
write.

Constraints:

- Test against a real relational database.
- Verify state from a separate query after failure.
- Ensure transaction cleanup allows the connection to be reused.
- Test success and failure, not implementation calls.

Proof: database integration tests and captured final rows.

Debrief: what would a service fake fail to prove here?

AI level: 1.

## Exercise 3 — concurrent uniqueness (applied)

Process two simultaneous commands with the same idempotency key.

Constraints:

- Use a durable unique constraint.
- Coordinate concurrency so both attempts overlap.
- Exactly one logical effect exists afterward.
- Both callers receive documented results.

Proof: repeatable concurrent integration test run many times.

Debrief: why is an in-memory `Set` insufficient even if one Node process is
currently deployed?

AI level: 2 after the test is designed.

## Exercise 4 — migration evolution (applied)

Add non-null `due_at` to an existing large ticket table without assuming it is
empty.

Constraints:

- Plan expand, backfill, application rollout, constraint enforcement, and
  rollback/forward recovery.
- Existing and new application versions must coexist during rollout.
- Backfill is restartable and bounded.
- Invalid priority or date data is addressed explicitly.

Proof: migration plan plus automated blank, upgrade, repeat, and interrupted
backfill scenarios.

Debrief: which steps are reversible, and what happens after an irreversible
data transformation?

AI level: 2 after your first plan.

## Exercise 5 — join correctness hunt (review)

Write a ticket report containing counts of comments and activities, including
tickets with zero children. Create one query with outer-join filtering and one
with aggregate fan-out bugs.

Constraints:

- A tiny fixture must expose both bugs.
- Fix correctness before optimizing.
- Compare a pre-aggregated or correlated alternative.

Proof: expected report table, failing queries, corrected query, and plan/query
count notes.

Debrief: why can several individually reasonable joins produce incorrect
aggregates?

AI level: 2, hints only.

## Exercise 6 — measured index decision (review)

Create a realistic ticket-queue dataset, baseline a filtered keyset query,
inspect its plan, and propose an index.

Constraints:

- Use the same dataset and query for before/after measurement.
- Include selectivity and ordering considerations.
- Measure at least one write-cost or storage consequence.
- Reject one index that sounds plausible but does not serve the query.

Proof: query, plan, timing distribution, chosen index, and ADR-style decision.

Debrief: under what data distribution might the chosen index stop helping?

AI level: 2 after baseline evidence.

## Project transfer

Apply to RD-401–404, RD-801–803, RD-1001, and RD-1102. The database should be
able to reject important invalid states even if an application bug reaches it.

