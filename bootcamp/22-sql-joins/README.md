# 22 · Relational SQL — Joins, Keys and Aggregates

Module 19 taught you to put rows in a table and read them back out. That
is one table. Real data is several tables that point at each other, and
the moment you have two, the interesting questions stop being "give me
the rows" and start being "give me the rows from here, matched up with
the rows from there — and tell me which ones had no match." That is a
join. Get it wrong in the four specific ways this module drills and you
ship a dashboard that silently under-reports revenue, a customer list
that omits your churned customers, and a page that fires 400 queries.
Get it right and the database does in one pass what your JavaScript was
about to do in a loop, over data that never has to leave the disk.

Everything here runs on `node:sqlite`, in memory, with no install.

## The mental model

**1 · A table is a typed array of objects; a foreign key is a pointer.**
`orders.customer_id` holds a number that must exist as `customers.id`.
Declare it and the database enforces it on every write, in both
directions — you cannot insert a child without a parent, or delete a
parent that still has children.

```sql
customer_id INTEGER NOT NULL REFERENCES customers(id)
```

**2 · A join is a keyed lookup, done row-wise.** For each row on the
left, find the rows on the right where the ON condition holds, and emit
one output row per match. That is the whole mechanism — say it out loud
when a result surprises you and it usually stops surprising you.

```sql
SELECT o.id, c.name          -- one row per MATCH:
  FROM orders o              -- 12 orders → 12 rows,
  JOIN customers c ON c.id = o.customer_id   -- Ada's name three times
```

The count of rows coming out is set by the *finest* table in the chain.
`orders` is 12 rows; `orders ⋈ order_items` is 20, because the grain
became the line item. Knowing the grain is how you avoid summing money
twice.

**3 · LEFT keeps the unmatched, and fills them with NULL.** Same
mechanism, one extra rule: if a left row matched nothing, emit it once
anyway with every right-hand column NULL. So the left result is always
the inner result *plus one row per unmatched left row*.

```
customers                          orders
┌────┬───────────┐                 ┌────┬─────────────┬───────┐
│ id │ name      │                 │ id │ customer_id │ total │
├────┼───────────┤                 ├────┼─────────────┼───────┤
│  1 │ Ada       │◀────────────────│  1 │           1 │ 12200 │
│  1 │ Ada       │◀────────────────│  3 │           1 │  7000 │
│  1 │ Ada       │◀────────────────│  8 │           1 │  9000 │
│  5 │ Alan      │◀────────────────│  7 │           5 │  9700 │
│  … │ …         │                 │  … │           … │     … │
│  7 │ Edsger    │   ✗ nothing points here
│  8 │ Katherine │   ✗ nothing points here
└────┴───────────┘                 └────┴─────────────┴───────┘

  customers JOIN orders        →  12 rows   (one per order)
      Ada|1  Ada|3  Ada|8  Alan|7  …
      Edsger and Katherine are simply not in the answer.

  customers LEFT JOIN orders   →  14 rows   (12 + the 2 unmatched)
      Ada|1  Ada|3  Ada|8  Alan|7  …
      Edsger|null      ← kept, padded with NULLs
      Katherine|null   ← this row is the entire reason for LEFT
```

Which table goes on the left *is* the design decision: "list the
orders" wants orders on the left, "how is every customer doing" wants
customers. Filter for the padding — `WHERE o.id IS NULL` — and you have
an anti-join: everyone who never ordered.

**4 · GROUP BY collapses; the aggregates describe what collapsed.** One
output row per distinct key, and `COUNT` / `SUM` / `AVG` / `MIN` / `MAX`
summarise the group. Over a LEFT JOIN the padded row is still a row, so
`COUNT(*)` says 1 where the truth is 0 — count the joined table's
primary key instead.

```sql
SELECT c.name,
       COUNT(o.id)                     AS orders,   -- 0 for Edsger
       COALESCE(SUM(o.total_cents), 0) AS revenue   -- SUM of ∅ is NULL
  FROM customers c
  LEFT JOIN orders o ON o.customer_id = c.id
 GROUP BY c.id
```

The order of evaluation, which explains every confusing grouped query:

```
FROM/JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT
             ↑                    ↑
      filters rows          filters groups
      (cannot see            (that is what it
       an aggregate)          is there for)
```

## The details that bite

1. **`= NULL` is never true.** It is not false either — it is NULL, and
   `WHERE` keeps only true. So the row vanishes with no error.
   `SELECT 1 WHERE NULL = NULL` → no rows. It has to be `IS NULL`.
2. **`COUNT(*)` over a LEFT JOIN counts the padding.** For Edsger,
   `COUNT(*)` → `1`, `COUNT(o.id)` → `0`. Count a NOT NULL column of the
   joined table, never `*`.
3. **Empty aggregates disagree with each other.** `COUNT` → `0`, but
   `SUM` → `NULL` and `AVG` → `NULL`. Wrap sums in `COALESCE(…, 0)`;
   leave averages null, because the mean of nothing is not zero.
4. **A missing `ON` is a cartesian product.** `FROM customers, orders`
   → 8 × 12 = 96 rows, returned instantly on toy data and never on real
   data. Every table after the first needs an `ON` tying it to the rest.
5. **Joining a second child table multiplies your money.**
   `orders ⋈ order_items` is 20 rows, not 12, so `SUM(o.total_cents)`
   there counts each order once *per line item*. Use `COUNT(DISTINCT
   o.id)` for parents, and sum at the grain the numbers live at.
6. **Aggregates cannot appear in `WHERE`.** `WHERE COUNT(*) >= 2` →
   `misuse of aggregate: COUNT()`. Nothing has been counted yet; that is
   `HAVING`'s job. Moving a condition between the two silently changes
   the answer.
7. **`ORDER BY` without a unique tiebreaker is not an order.** Two rows
   tied at 9700 may come back either way round, and may change their
   minds once an index exists — which makes a paginated report skip and
   repeat rows.
8. **Dates are strings; only ISO ones behave.** `'YYYY-MM-DD'` sorts and
   compares correctly as text and `strftime` understands it.
   `strftime('%Y-%m', '06/2024')` → `null`, no error, silent hole.
9. **Money in floats is a bug you ship.** Store cents as `INTEGER`. This
   module's `price` and `total_cents` are cents, and formatting happens
   at the edge, never in the query.
10. **Bare column names go ambiguous the moment there are two tables.**
    `SELECT id FROM customers c JOIN orders o …` → `ambiguous column
    name: id`. Qualify everything, always; `SELECT *` across a join also
    hands you two columns both called `id`.
11. **An unaliased expression becomes its own text.** `SELECT qty *
    price` gives you `row['qty * price']`, which changes if you reformat
    the query. `AS line_total`.
12. **Declaring a foreign key is not the same as enforcing one.** Plain
    sqlite ships with `foreign_keys` OFF for backwards compatibility;
    `node:sqlite` turns it ON. Read `PRAGMA foreign_keys` rather than
    assuming, and set it explicitly in code you ship.
13. **Foreign keys block `DELETE` too.** Removing a customer who still
    has orders throws, unless you asked for `ON DELETE CASCADE`. Silence
    is not a policy, it is `NO ACTION`.
14. **`node:sqlite` rows have a null prototype.** Deep-equality against a
    plain literal fails. Spread once at the boundary: `{ ...row }`.
15. **A loop with a query inside it is an N+1.** 12 orders cost 13
    queries; the join costs 1. It tracks rows, not distinct parents, so
    caching is the wrong first answer. Count the queries — do not guess.
16. **The child side of a foreign key is not indexed for you.** sqlite
    indexes `INTEGER PRIMARY KEY` for free, so `c.id` is a SEARCH from
    day one while `orders.customer_id` stays a SCAN until you say
    `CREATE INDEX`. That one column is most "it got slow as we grew".
17. **An index is a candidate, not an instruction.** The planner will
    ignore one when a scan is genuinely cheaper. `EXPLAIN QUERY PLAN` is
    one line and it tells you the truth.

## Cheat table

| you want | the SQL |
| --- | --- |
| rows that match on both sides | `FROM a JOIN b ON b.a_id = a.id` |
| every left row, match or not | `FROM a LEFT JOIN b ON b.a_id = a.id` |
| the left rows with no match | `LEFT JOIN … WHERE b.id IS NULL` |
| a name instead of a foreign key | `SELECT b.name AS thing` |
| three tables | one `JOIN … ON …` per hop |
| a computed column | `qty * price AS line_total` |
| one row per group | `GROUP BY a.id` (the id, not the name) |
| how many real children | `COUNT(b.id)` — not `COUNT(*)` |
| distinct parents over a fan-out | `COUNT(DISTINCT a.id)` |
| an empty SUM as a number | `COALESCE(SUM(x), 0)` |
| filter rows before grouping | `WHERE` |
| filter groups after | `HAVING COUNT(*) >= ?` |
| the top n | `ORDER BY revenue DESC, name LIMIT ?` |
| compare a row to the whole table | `> (SELECT AVG(x) FROM …)` |
| aggregate an aggregate | `FROM (SELECT SUM(x) AS s … GROUP BY …)` |
| pairs from one table | `FROM t a JOIN t b ON b.k = a.k AND b.id > a.id` |
| a month out of an ISO date | `strftime('%Y-%m', placed_on)` |
| is my join indexed? | `EXPLAIN QUERY PLAN …` → SCAN vs SEARCH |
| index the child side | `CREATE INDEX … ON orders(customer_id)` |
| enforce the keys | `PRAGMA foreign_keys = ON` |

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-two-tables-and-a-key.js` | ★☆☆ | two tables, a `REFERENCES` key, and what it refuses |
| 02 | `02-inner-join.js` | ★☆☆ | INNER JOIN: orders that carry the customer's name |
| 03 | `03-join-and-filter.js` | ★★☆ | `WHERE` across a join, on either table's columns |
| 04 | `04-left-join.js` | ★★☆ | the same report inner and left — 12 rows vs 14 |
| 05 | `05-finding-absences.js` | ★★☆ | anti-joins: who never ordered, what never sold |
| 06 | `06-three-table-join.js` | ★★☆ | orders → items → products, with line totals |
| 07 | `07-group-by-with-joins.js` | ★★★ | `GROUP BY` over a LEFT JOIN, and the `COUNT(*)` trap |
| 08 | `08-having-vs-where.js` | ★★☆ | filter rows before grouping, groups after |
| 09 | `09-top-n-report.js` | ★★☆ | best customers and best sellers, with tiebreakers |
| 10 | `10-n-plus-one.js` | ★★★ | 13 queries vs 1, with a counter to prove it |
| 11 | `11-subqueries.js` | ★★★ | a query used as a value: who beats the average |
| 12 | `12-self-join.js` | ★★★ | `order_items` joined to itself: bought together |
| 13 | `13-join-indexes.js` | ★★★ | `EXPLAIN QUERY PLAN`, and SCAN turning into SEARCH |
| 14 | `14-reporting-capstone.js` | ★★★ | monthly revenue and customer lifetime value |

Do the warm-ups and core in order. Stretch if time allows — but do 10
whichever way you go; it is the one that shows up in code review.

Run one file at a time:

```
node exercises/01-two-tables-and-a-key.js
```

Every test should say `todo` before you start and `all green — next
file!` when you are done. The `solutions/` copy has the same tests plus
a walkthrough explaining why the query is shaped that way — read it
after your own attempt, not before.

## The shop

Every file from 02 onwards defines the same four tables and the same
rows, inline, so each one still runs on its own with plain `node`:

```
customers   8 rows   Ada, Grace, Linus, Margaret, Alan, Barbara,
                     Edsger, Katherine
products    6 rows   keyboard, mouse, monitor, desk mat, usb hub,
                     laptop stand
orders     12 rows   Jan–May 2024, customer_id → customers.id
order_items 20 rows  order_id → orders.id, product_id → products.id
```

Three gaps in that data are deliberate, and every exercise leans on at
least one of them: **Edsger and Katherine have never ordered**, and
**nobody has ever bought the laptop stand**. The whole shop turns over
167300 cents.

Prices and totals are integers in cents. `orders.total_cents` is
denormalised on purpose — exercise 06 recomputes it from the line items
and checks the two agree, which is a real integrity check worth running
against a real database.

These exercises need module 19's `14-sqlite-basics` (schema, prepared
statements, parameters) and nothing else from it; transactions and
migrations stay over there. `node:sqlite` is built into Node 22 — no
install, no flag. It prints an `ExperimentalWarning` on stderr the first
time you import it, which is noise, not a problem. Every file opens
`':memory:'`, so the tests are fast and touch no disk at all.

---

**Stuck?** `cheatsheets/big-o.md` (why an index changes the plan) · **Self-check:** `quizzes/13-sql.md` · **Next:** `bootcamp/23-node-drills`, or `bootcamp/27-sql-data` to go straight on with SQL
