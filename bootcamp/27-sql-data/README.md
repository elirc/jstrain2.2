# 27 · SQL — Data, Not Just Joins

Module 22 taught you to READ queries. This one teaches you to CHANGE data
safely, which is where CRUD apps actually live and where interviews probe
for depth. Every exercise runs on `node:sqlite` — built into Node 22, no
install — so the whole thing is offline and each file grades itself.

The five things that separate "I can write a SELECT" from "I own the data
layer":

- **Transactions** — several writes that must all happen or none do.
- **Constraints + UPSERT** — let the database enforce uniqueness and
  resolve the insert-or-update race in one atomic statement.
- **Keyset pagination** — the pagination that doesn't rot at page 5000.
- **Schema design** — the "model orders and refunds" interview kata, with
  the one decision (price at purchase time) that trips juniors.
- **Migrations** — forward-only, applied once, safe to re-run.

## The mental model

Reads forgive; writes don't. A wrong SELECT shows you bad numbers you can
re-run. A wrong write is permanent — money vanishes, a row is
double-inserted, a schema is half-migrated. So the discipline of this
module is **let the database do what only it can do**:

1. **Atomicity is the database's job — take it.** Wrap related writes in
   BEGIN/COMMIT so a crash or a failed check rolls the whole set back.
   Never emulate a transaction with application-side "undo" code.
2. **Constraints are correctness you can't forget.** A UNIQUE or FOREIGN
   KEY is enforced on every path, including the one you didn't test.
   Push invariants into the schema; then ON CONFLICT lets you upsert
   without a read-modify-write race.
3. **Pagination and history are design, not afterthoughts.** OFFSET is
   O(offset) and unstable; keyset is O(log n) and stable. An order must
   record the price it charged, not point at a price that will change.

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-transactions.js` | ★★☆ | a money transfer that rolls back on overdraw |
| 02 | `02-unique-upsert.js` | ★★☆ | save-a-setting as one atomic ON CONFLICT upsert |
| 03 | `03-keyset-pagination.js` | ★★★ | seek pagination that survives inserts |
| 04 | `04-schema-orders.js` | ★★★ | design orders/items/refunds; price at purchase time |
| 05 | `05-migrations.js` | ★★☆ | a forward-only migration runner, idempotent |

Do them in order; 01 sets up the transaction pattern that 05 reuses.

```
node exercises/01-transactions.js   # run it, fill the TODO, re-run
node solutions/01-transactions.js   # reference + walkthrough
node ../progress.js 27              # scoreboard
```

**Stuck?** `cheatsheets/big-o.md` (index costs) · **Deep dive:** `guides/03-values-references-and-memory.md` (why cents, not floats) · **Self-check:** `quizzes/13-sql.md` · **Next:** `bootcamp/28-api-consumer`
