# 27 · SQL and Data

Module 17 taught EF Core, which writes your SQL for you. This module is about
the parts EF cannot decide for you: how values reach the database safely, how
multi-step changes stay atomic, and how to page through a table that is
changing while you read it.

## The mental model

**1. A parameter is structural, not an escape.**

```csharp
$"... WHERE Name = '{name}'"        // ❌ injection
"... WHERE Name = $name"            // ✅ parameter
```

The value **never becomes part of the statement**. The database parses the
SQL once and receives the value separately, so there is nothing to break out
of. Escaping is a filter you can get wrong; parameterisation removes the
category.

The tell that escaping is the wrong model: with concatenation, `O'Brien`
produces a *syntax error*. A legitimate name is indistinguishable from an
attack, because both are "text that changes the parse".

**2. A multi-step change is one transaction, or it is a bug.**

```csharp
using var transaction = db.BeginTransaction();
// … debit … credit …
transaction.Commit();          // dispose without this = rollback
```

Debit one account, credit another, and let the second fail: money has
vanished. Do the read **inside** the transaction too — checking the balance
first and then opening one leaves a race.

**3. `Skip(n).Take(m)` drifts.**

| | Offset | Keyset |
| --- | --- | --- |
| Means | "start at position N" | "start after this row" |
| Cost at depth | O(offset) — finds and discards | constant — seeks the index |
| Insert before your position | **duplicates a row** | unaffected |
| Delete before your position | **skips a row** | unaffected |
| Jump to page 7 | yes | **no** |

```sql
WHERE (CreatedAt, Id) < (@at, @id)
ORDER BY CreatedAt DESC, Id DESC
LIMIT @size
```

Position is relative; a key is absolute. On a newest-first feed, inserts at
the front are constant — so drift is the normal case, not an edge case.

## The details that bite

1. **The ordering key must be unique.** Order by a timestamp alone and rows
   sharing one can appear on both pages or neither. Pair it with the id.

2. **SQLite requires `command.Transaction = transaction`.** Forget it and the
   command throws rather than silently running outside — which is the better
   failure, but surprising the first time.

3. **Disposing an uncommitted transaction rolls back.** So a `using` plus an
   early `throw` is already correct; an explicit `Rollback()` is optional.

4. **SQLite has no decimal type** (module 17). Store money as TEXT so it
   round-trips exactly rather than through a float.

5. **Keyset cannot jump to an arbitrary page.** That is its one real
   limitation, and the reason offset paging is still fine for small, stable,
   admin-facing tables.

6. **`AddWithValue` infers the parameter type.** Fine for SQLite; on SQL
   Server it can pick a type that defeats an index (`nvarchar` against a
   `varchar` column). Specify the type explicitly on a hot path.

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-parameters-and-transactions.cs` | ★★★ | injection payloads that do nothing; a transfer that cannot lose money |
| 02 | `02-pagination.cs` | ★★☆ | watch offset paging duplicate a row, then fix it with a cursor |

Do them in order. **01's O'Brien test** is the one that reframes injection:
the same input that breaks a concatenated query is an ordinary surname, which
is why "escape the quotes" is not a defence. **02's drift test** shows the
duplicate appearing with no error anywhere.

---

**Stuck?** `cheatsheets/ef-core.md` (queries, transactions) · **Self-check:** `quizzes/09-ef-core.md` · **Next:** `csbootcamp/28-http-client-resilience`
