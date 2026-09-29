# 19 — Node persistence

## Outcome

Make file and database persistence explicit about atomicity, recovery,
serialization, locking, transactions, and schema evolution.

## The 80/20 model

Durability is a contract under interruption. For files, write temporary data
in the same filesystem, flush/close as required, then rename atomically where
supported. Append-only logs simplify writes but need validation, replay, and
compaction policy.

Relational databases provide constraints, transactions, indexes, and query
semantics that application arrays do not. Parameterize values. Let durable
constraints arbitrate concurrent invariants. Treat rows as persistence shapes
and map them into domain values.

Migrations must serve blank install and upgrade paths. Record success after
completion, handle partial failure, and plan compatibility with overlapping
application versions.

## Common traps

- Directly overwriting important files.
- Assuming one Node process means no concurrent writer.
- Read/check/write race without a constraint.
- Transaction covering only some business writes.
- Database rows returned directly as API models.
- Migration history updated before successful commit.

## Optimized exercises

1. **File:** build crash-conscious atomic JSON save plus recovery behavior for
   stale temporary/corrupt files.
2. **Database:** implement ticket/comment repository operations with
   parameterized SQL, constraint mapping, and real integration tests.
3. **Application:** run RelayDesk migrations from blank and prior schema,
   force mid-migration failure, and document recovery/compatibility.

## Exit gate

For one write, state what becomes durable, what is atomic, what concurrent
operation can interfere, and how recovery detects incomplete state.

More reps: `../../bootcamp/19-node-persistence/`.

