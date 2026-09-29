# 13 · SQL — joins, NULLs, grouping, and what the planner does

Pairs with [`bootcamp/22-sql-joins`](../bootcamp/22-sql-joins/README.md). Cover the answer, say the exact
rows out loud, then reveal. Every result below was produced by actually running the query on
`node:sqlite` (Node v22.16.0) against the fixture on this page — not from memory.

**Every question uses these three tables.** Learn them now; they are not repeated.

```
customers                 orders                              items
┌────┬───────┐            ┌────┬─────────────┬───────┐        ┌────┬──────────┬─────┐
│ id │ name  │            │ id │ customer_id │ total │        │ id │ order_id │ sku │
├────┼───────┤            ├────┼─────────────┼───────┤        ├────┼──────────┼─────┤
│  1 │ Ada   │            │ 10 │           1 │   100 │        │  1 │       10 │ a   │
│  2 │ Grace │            │ 11 │           1 │    50 │        │  2 │       10 │ b   │
│  3 │ Linus │            │ 12 │           2 │  NULL │        │  3 │       11 │ c   │
└────┴───────┘            │ 13 │        NULL │    70 │        └────┴──────────┴─────┘
                          └────┴─────────────┴───────┘
```

Three gaps are deliberate, and most of this file leans on at least one: **Linus has never
ordered**, **order 12 has no total**, and **order 13 has no customer**. Results are written as
pipe-separated rows, so `Ada|100` is one row with two columns.

---

### Q1 — the inner join

What does this return, and how many rows?

```sql
SELECT c.name, o.total
  FROM customers c
  JOIN orders o ON o.customer_id = c.id
 ORDER BY o.id;
```

<details><summary>Answer</summary>

**`Ada|100`, `Ada|50`, `Grace|NULL` — 3 rows.**

One output row per *match*, so Ada appears once per order and the grain of the result is the order, not the customer. Two rows from the tables are missing and both absences are the point: Linus has no order, and order 13 has no customer, so neither side of an unmatched pair survives an inner join. Note `Grace|NULL` is present — a NULL in a *column* has nothing to do with whether the row matched; the join condition looked at `customer_id`, which is `2`.
</details>

---

### Q2 — the left join

What does this return, and how many rows?

```sql
SELECT c.name, o.total
  FROM customers c
  LEFT JOIN orders o ON o.customer_id = c.id
 ORDER BY c.id, o.id;
```

<details><summary>Answer</summary>

**`Ada|100`, `Ada|50`, `Grace|NULL`, `Linus|NULL` — 4 rows.**

A LEFT JOIN is the inner result *plus one padded row per unmatched left row*, so Linus comes back once with every right-hand column NULL. Order 13 is still absent, because it is on the right — putting `customers` on the left decides whose absences you keep. Notice the trap this sets up: `Grace|NULL` and `Linus|NULL` look identical in the output, but one is a real order with no total and the other is no order at all. Only a NOT NULL column of the joined table — `o.id` — can tell them apart.
</details>

---

### Q3 — the filter that undoes it

What does each of these return?

```sql
SELECT c.name, o.total FROM customers c
  LEFT JOIN orders o ON o.customer_id = c.id
 WHERE o.total > 60;

SELECT c.name, o.total FROM customers c
  LEFT JOIN orders o ON o.customer_id = c.id AND o.total > 60;
```

<details><summary>Answer</summary>

**First: `Ada|100` — 1 row. Second: `Ada|100`, `Grace|NULL`, `Linus|NULL` — 3 rows.**

The first query silently became an inner join. `WHERE` runs *after* the join, and the padded rows it produced hold `o.total = NULL`, so `NULL > 60` is NULL, which is not true, and every unmatched customer is discarded. Put the condition in the `ON` clause instead and it is applied *while* matching, so rows that fail it simply don't match and the left row is padded as usual. The rule: conditions on the right-hand table belong in `ON`; conditions on the left-hand table belong in `WHERE`. This is the single most common way a "every customer" report quietly stops being about every customer.
</details>

---

### Q4 — the anti-join

What does this return?

```sql
SELECT c.name
  FROM customers c
  LEFT JOIN orders o ON o.customer_id = c.id
 WHERE o.id IS NULL;
```

<details><summary>Answer</summary>

**`Linus` — 1 row.**

This is Q3's accident used deliberately: keep every left row, then filter for exactly the padding. `o.id` is the right table's primary key, so it is NULL if and only if nothing matched — which is why you test that column and never a nullable one like `o.total` (testing `o.total IS NULL` would also return Grace, whose order exists but has no total). This is the query behind "customers who never ordered", "products never sold", "users with no sessions since March". The alternative spellings are `NOT EXISTS` and `NOT IN`, and Q9 shows why one of them is a trap.
</details>

---

### Q5 — counting over a left join

What does this return?

```sql
SELECT c.name, COUNT(*) AS star, COUNT(o.id) AS real_orders
  FROM customers c
  LEFT JOIN orders o ON o.customer_id = c.id
 GROUP BY c.id
 ORDER BY c.id;
```

<details><summary>Answer</summary>

**`Ada|2|2`, `Grace|1|1`, `Linus|1|0` — 3 rows.**

`COUNT(*)` counts *rows in the group*, and Linus's group contains exactly one row — the padded one — so it reports `1` where the truth is `0`. `COUNT(expr)` counts rows where the expression is not NULL, so `COUNT(o.id)` correctly reports `0`. This off-by-one is invisible in testing because it only appears for entities with no children, which is exactly the case nobody seeds test data for. Over a LEFT JOIN, always count a NOT NULL column of the joined table.
</details>

---

### Q6 — aggregating nothing

What does this return?

```sql
SELECT c.name,
       SUM(o.total) AS s,
       COALESCE(SUM(o.total), 0) AS c0,
       AVG(o.total) AS a
  FROM customers c
  LEFT JOIN orders o ON o.customer_id = c.id
 GROUP BY c.id
 ORDER BY c.id;
```

<details><summary>Answer</summary>

**`Ada|150|150|75`, `Grace|NULL|0|NULL`, `Linus|NULL|0|NULL` — 3 rows.**

The empty aggregates disagree with each other on purpose: `COUNT` of nothing is `0`, but `SUM` of nothing is **NULL** and `AVG` of nothing is **NULL**. Ada's average is `75`, not `50` — `AVG` divides by the count of *non-NULL* values, so it ignores missing data rather than treating it as zero. Wrap sums in `COALESCE(…, 0)` because a total of nothing really is zero money; leave averages NULL, because the mean of nothing is genuinely undefined and a `0` there is a lie your dashboard will repeat.
</details>

---

### Q7 — comparing to NULL

What does each of these return?

```sql
SELECT id FROM orders WHERE total = NULL;
SELECT id FROM orders WHERE total IS NULL;
SELECT NULL = NULL AS a, NULL IS NULL AS b, 1 = NULL AS c;
```

<details><summary>Answer</summary>

**No rows. Then `12`. Then `NULL|1|NULL` — one row.**

SQL is three-valued: a comparison against NULL yields NULL, which is neither true nor false, and `WHERE` keeps only rows that are *true*. So `= NULL` matches nothing, ever, and does it silently — no error, no warning, just an empty result set that looks like a legitimate "no data". Even `NULL = NULL` is NULL, because NULL means "unknown" and two unknowns are not knowably equal. `IS NULL` and `IS NOT NULL` are the only operators that test it, and they return a real boolean (SQLite prints booleans as `1`/`0`).
</details>

---

### Q8 — the rows a negation drops

What does this return?

```sql
SELECT id FROM orders WHERE total <> 100 ORDER BY id;
```

<details><summary>Answer</summary>

**`11`, `13` — 2 rows.**

Order 12 is missing. Its total is NULL, so `NULL <> 100` is NULL, not true, and the row is filtered out — even though "an order whose total is not 100" plainly describes it. Every negated predicate has this hole: `!=`, `NOT IN`, `NOT LIKE`, and `<` all drop NULL rows on both sides of the split, so `WHERE total = 100` and `WHERE total <> 100` together do **not** return the whole table. If NULL should count as "not 100", say so: `WHERE total IS NULL OR total <> 100`, or `WHERE COALESCE(total, -1) <> 100`.
</details>

---

### Q9 — NOT IN meets a NULL

What does each of these return?

```sql
SELECT name FROM customers WHERE id IN (SELECT customer_id FROM orders);
SELECT name FROM customers WHERE id NOT IN (SELECT customer_id FROM orders);
```

<details><summary>Answer</summary>

**First: `Ada`, `Grace` — 2 rows. Second: no rows at all.**

`NOT IN` expands to `id <> 1 AND id <> 1 AND id <> 2 AND id <> NULL`, and that last term is NULL for every candidate row, so the whole conjunction can never be true — the result is empty regardless of the data. `IN` is unaffected because one true term is enough to make an OR chain true. This is the most dangerous NULL bug in SQL: the query is syntactically fine, returns a plausible "nobody matched", and breaks the moment one nullable row appears in a subquery that used to be clean. Fix it with `WHERE customer_id IS NOT NULL` inside the subquery, or use `NOT EXISTS`.
</details>

---

### Q10 — NOT EXISTS

What does this return, and why is it immune to Q9?

```sql
SELECT name FROM customers c
 WHERE NOT EXISTS (
   SELECT 1 FROM orders o WHERE o.customer_id = c.id
 );
```

<details><summary>Answer</summary>

**`Linus` — 1 row.**

`EXISTS` asks a yes/no question about whether the subquery produced any rows, and "did it produce rows" is genuinely two-valued — there is no unknown. The NULL in `orders.customer_id` simply fails the correlated `=` comparison and contributes no row, which is the correct answer rather than a poisoned one. `NOT EXISTS` and the `LEFT JOIN … IS NULL` anti-join from Q4 are equivalent in both meaning and, on any modern planner, in speed. `SELECT 1` is conventional: the column list of an `EXISTS` subquery is never evaluated.
</details>

---

### Q11 — the three COUNTs

What does this return?

```sql
SELECT COUNT(*) AS star,
       COUNT(total) AS tot,
       COUNT(customer_id) AS cust,
       COUNT(DISTINCT customer_id) AS dcust
  FROM orders;
```

<details><summary>Answer</summary>

**`4|3|3|2` — one row.**

`COUNT(*)` counts rows: 4. `COUNT(col)` counts rows where that column is not NULL, so both `total` and `customer_id` report 3 — which means `COUNT(*) - COUNT(col)` is a free NULL census. `COUNT(DISTINCT col)` counts distinct non-NULL values, and the two orders belonging to Ada collapse to one, giving 2. Read a `COUNT` in someone else's query as a question about *which* thing is being counted: rows, present values, or distinct entities. They differ by exactly the amount that makes a report wrong.
</details>

---

### Q12 — WHERE versus HAVING

What does each of these do?

```sql
SELECT customer_id, COUNT(*) FROM orders WHERE COUNT(*) >= 2 GROUP BY customer_id;
SELECT customer_id, COUNT(*) AS n FROM orders GROUP BY customer_id HAVING COUNT(*) >= 2;
```

<details><summary>Answer</summary>

**The first throws `Error: misuse of aggregate: COUNT()`. The second returns `1|2` — one row.**

The evaluation order is `FROM/JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT`. At `WHERE` time nothing has been grouped yet, so there is no count to compare — the aggregate literally does not exist. `HAVING` exists precisely to filter *after* grouping. The practical version: `WHERE` filters rows going in, `HAVING` filters groups coming out, and moving a condition between them silently changes the answer whenever it touches the joined table. Filtering rows in `WHERE` first is also faster, because fewer rows reach the grouping.
</details>

---

### Q13 — HAVING with no GROUP BY

What do these return?

```sql
SELECT COUNT(*) AS n FROM orders HAVING COUNT(*) > 100;
SELECT COUNT(*) AS n FROM orders HAVING COUNT(*) > 1;
```

<details><summary>Answer</summary>

**First: no rows. Second: `4` — one row.**

With no `GROUP BY`, an aggregate query is one implicit group covering the whole table, so it always produces exactly one row — and `HAVING` can filter that single row away entirely. That is why an aggregate query can return **zero** rows rather than a row containing zero, which breaks any client that does `rows[0].n` without checking. Worth internalizing for the same reason: `SELECT COUNT(*) FROM empty_table` returns one row containing `0`, while `SELECT MAX(x) FROM empty_table` returns one row containing NULL.
</details>

---

### Q14 — the bare column

What does this return?

```sql
SELECT customer_id, id, total
  FROM orders
 GROUP BY customer_id
 ORDER BY customer_id;
```

<details><summary>Answer</summary>

**`NULL|13|70`, `1|10|100`, `2|12|NULL` — 3 rows.**

`id` and `total` are neither grouped nor aggregated, so there is no defined answer for "which of Ada's two orders" — SQLite picks one, and it picks whichever it happened to have. PostgreSQL and modern MySQL reject this query outright with "column must appear in the GROUP BY clause or be used in an aggregate function", which is the more useful behaviour. Also note NULL forms its own group here: `GROUP BY` treats all NULLs as one group even though `NULL = NULL` is not true (Q7). If you want a specific row per group, use `MAX(...)`, or a window function, not a bare column.
</details>

---

### Q15 — grouping by the wrong key

Suppose a fourth customer `(4, 'Ada')` exists with one order. What do these two return?

```sql
SELECT c.name, COUNT(o.id) AS n FROM customers c
  LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.name ORDER BY c.name;

SELECT c.id, c.name, COUNT(o.id) AS n FROM customers c
  LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id ORDER BY c.id;
```

<details><summary>Answer</summary>

**First: `Ada|3`, `Grace|1`, `Linus|0` — 3 rows. Second: `1|Ada|2`, `2|Grace|1`, `3|Linus|0`, `4|Ada|1` — 4 rows.**

Grouping by `name` merged two different people who happen to share one, and reported a customer with three orders who does not exist. Nothing errors; you just get a shorter result set with inflated numbers. Group by the **primary key** and carry the display name along for the ride — SQLite and Postgres both allow selecting `c.name` when you grouped by `c.id`, because the key functionally determines it. The general rule: group by identity, display by label, and never let a human-readable string be the grouping key.
</details>

---

### Q16 — the fan-out

What does this return?

```sql
SELECT SUM(o.total) AS bad, COUNT(*) AS rows_out
  FROM orders o
  JOIN items i ON i.order_id = o.id;
```

<details><summary>Answer</summary>

**`250|3` — one row, and the true revenue of those orders is 150.**

Order 10 has two line items, so the join duplicates its row, and `SUM` faithfully adds its 100 twice. The join changed the *grain* of the result from one row per order to one row per line item, and any parent-level number summed at that grain is multiplied by each parent's child count. It never errors, and it always errs upward — which is why it survives review. Say the grain out loud before you aggregate: "after this join, one row is one line item."
</details>

---

### Q17 — counting parents after a fan-out

What does this return?

```sql
SELECT COUNT(DISTINCT o.id) AS orders, COUNT(*) AS rows_out
  FROM orders o
  JOIN items i ON i.order_id = o.id;
```

<details><summary>Answer</summary>

**`2|3` — one row.**

`COUNT(DISTINCT o.id)` counts the parents, `COUNT(*)` counts the joined rows, and the gap between them is the fan-out factor. That is the diagnostic: if the two disagree, any non-distinct aggregate in the same query is suspect. `DISTINCT` fixes counting but it does **not** fix `SUM` — `SUM(DISTINCT o.total)` would collapse two genuinely different orders that happened to cost the same amount. To sum money correctly across a fan-out you aggregate the children in a subquery first, then join the one-row-per-parent result (Q24).
</details>

---

### Q18 — a query used as a value

What does this return?

```sql
SELECT id, total FROM orders
 WHERE total > (SELECT AVG(total) FROM orders)
 ORDER BY id;
```

<details><summary>Answer</summary>

**`10|100` — 1 row.** The average is `73.33333333333333` over the three non-NULL totals.

A scalar subquery returns one row and one column and can stand anywhere a value can. It is evaluated once for the whole statement here, because nothing inside it references the outer query. Two details that decide the answer: `AVG` ignores the NULL total entirely rather than treating it as zero (which would have dragged the average down to 55 and let order 13 through), and order 12 is excluded from the result by the NULL rule of Q8. Comparing each row to a whole-table aggregate is the shape behind "above average", "more than the median", "top decile".
</details>

---

### Q19 — the correlated subquery

What does this return, and what is it doing per row?

```sql
SELECT c.name,
       (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) AS n
  FROM customers c
 ORDER BY c.id;
```

<details><summary>Answer</summary>

**`Ada|2`, `Grace|1`, `Linus|0` — 3 rows.**

This is *correlated*: the inner query references `c.id` from the outer one, so conceptually it re-runs for every outer row — the SQL spelling of an N+1. It produces the same answer as the `LEFT JOIN … GROUP BY` in Q5, with two differences worth knowing. It naturally reports `0` rather than `1` for the childless row, so it sidesteps the `COUNT(*)` trap. And planners usually rewrite it into a join anyway — but "usually" is doing work, so check `EXPLAIN` before using this shape for several columns at once, where each one is another pass.
</details>

---

### Q20 — DISTINCT versus GROUP BY

What does each return?

```sql
SELECT DISTINCT customer_id FROM orders ORDER BY customer_id;
SELECT customer_id FROM orders GROUP BY customer_id ORDER BY customer_id;
```

<details><summary>Answer</summary>

**Both return `NULL`, `1`, `2` — 3 rows each.**

For a plain column list they are the same operation, and most planners produce an identical plan; `GROUP BY` is only different once you add an aggregate to the select list. Note NULL survives as its own value in both — `DISTINCT` and `GROUP BY` treat all NULLs as one group even though `NULL = NULL` is not true. Two habits worth keeping: reach for `GROUP BY` when you *might* add a count later, and treat a `SELECT DISTINCT` that appeared to "fix duplicates" as a smell — it usually means a join is fanning out (Q16) and the duplicates are hiding a wrong number somewhere else.
</details>

---

### Q21 — UNION versus UNION ALL

What does each return?

```sql
SELECT name FROM customers WHERE id <= 2 UNION SELECT 'Ada' ORDER BY name;
SELECT name FROM customers WHERE id <= 2 UNION ALL SELECT 'Ada';
```

<details><summary>Answer</summary>

**First: `Ada`, `Grace` — 2 rows. Second: `Ada`, `Grace`, `Ada` — 3 rows.**

`UNION` de-duplicates the combined result, which means it has to sort or hash everything first — real work you pay for on every run. `UNION ALL` just concatenates, and it is what you want whenever you know the branches are disjoint, or when duplicates are meaningful (two orders of the same amount are two orders). The default being the expensive one is a trap: `UNION ALL` should be your reflex, with plain `UNION` reserved for when you have actually thought about the overlap. Both require the same column count and compatible types in each branch.
</details>

---

### Q22 — the missing ON

How many rows does this return?

```sql
SELECT COUNT(*) AS n FROM customers, orders;
```

<details><summary>Answer</summary>

**`12` — one row containing 12, which is 3 customers times 4 orders.**

Comma-join syntax with no `WHERE` linking the tables is a cartesian product: every row on the left paired with every row on the right. On this fixture it is instant and obviously wrong; on 10,000 customers and 100,000 orders it is a billion rows and a dead connection. The reason it happens is always the same — someone added a third table to a comma-separated `FROM` list and forgot its `WHERE` clause. Use explicit `JOIN … ON` syntax, which makes the missing condition a syntax error instead of a silent explosion, and write `CROSS JOIN` when you actually mean it.
</details>

---

### Q23 — the self join

What does this return?

```sql
SELECT a.sku AS left_sku, b.sku AS right_sku
  FROM items a
  JOIN items b ON b.order_id = a.order_id AND b.id > a.id;
```

<details><summary>Answer</summary>

**`a|b` — 1 row.**

A table joined to itself under two aliases is how you compare rows to their siblings: "products bought together", "employees and their managers", "duplicate accounts sharing an email". The `b.id > a.id` half of the condition is the load-bearing part — without it you would get each pair twice (once in each order) plus every row matched to itself, three times the rows and a wrong answer. Order 11 contributes nothing because a single item has no sibling. Every self join needs an alias on both sides; otherwise every column reference is ambiguous.
</details>

---

### Q24 — aggregating an aggregate

What does this return?

```sql
SELECT AVG(per.n) AS avg_orders, MAX(per.n) AS most FROM (
  SELECT c.id, COUNT(o.id) AS n
    FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.id
   GROUP BY c.id
) per;
```

<details><summary>Answer</summary>

**`1|2` — one row.** Counts per customer are 2, 1, and 0, averaging 1.

You cannot nest aggregates directly — `AVG(COUNT(*))` is an error — so the pattern is to put the grouped query in the `FROM` clause and aggregate its output. Read it inside out: the inner query produces one row per customer, the outer one collapses those rows. This is the shape for "average orders per customer", "the busiest day's volume", "median-ish reporting". The `LEFT JOIN` in the inner query is what keeps Linus's `0` in the average; an inner join would have averaged 1.5 and quietly answered a different question.
</details>

---

### Q25 — count the queries

Reading this JavaScript against the fixture, how many SQL statements execute, and what is the fix?

```js
const customers = db.prepare('SELECT id, name FROM customers').all();
for (const c of customers) {
  db.prepare('SELECT total FROM orders WHERE customer_id = ?').all(c.id);
}
```

<details><summary>Answer</summary>

**4 — one for the list, then one per customer. The join version is 1.**

This is the N+1 query problem, and the number to internalize is that it scales with *rows*, not with distinct parents: 3 customers cost 4 queries, 3,000 cost 3,001, each with its own round trip. It is invisible locally against SQLite in-process and lethal over a network at 1ms per hop. The fix is one `LEFT JOIN` (or one `WHERE customer_id IN (...)` followed by grouping in JavaScript), not a cache — caching an N+1 just makes the second page load fast and hides the shape. Count queries, don't estimate them: instrument the driver and assert the number in a test.
</details>

---

### Q26 — SCAN versus SEARCH

`EXPLAIN QUERY PLAN SELECT * FROM orders WHERE customer_id = 1` reports `SCAN orders`. After `CREATE INDEX idx_orders_customer ON orders(customer_id)` it reports something else. What, and why was the index missing in the first place?

<details><summary>Answer</summary>

**`SEARCH orders USING INDEX idx_orders_customer (customer_id=?)`.**

`SCAN` means every row was read and tested; `SEARCH` means the engine jumped straight to the matching rows through an index. The index was missing because **declaring a foreign key does not create one**. SQLite indexes `INTEGER PRIMARY KEY` for free, so the *parent* side (`customers.id`) is fast from day one, while the *child* side (`orders.customer_id`) stays a full scan until you create it explicitly — and that one missing index is the single most common cause of "it got slow as we grew", because the scan cost grows with the child table while your test data never does. Postgres and MySQL/InnoDB differ here: InnoDB creates the child index automatically, Postgres does not.
</details>

---

### Q27 — the index the query cannot use

With an index on `customers(name)`, `WHERE name = 'Ada'` plans as `SEARCH customers USING COVERING INDEX idx_customers_name (name=?)`. What do these two plan as, and why?

```sql
SELECT * FROM customers WHERE LOWER(name) = 'ada';
SELECT * FROM customers WHERE name LIKE '%da';
```

<details><summary>Answer</summary>

**Both plan as `SCAN customers`.**

An index stores the column's values in sorted order, so it can answer questions about `name` — but `LOWER(name)` is a *different value* that appears nowhere in the index, and the engine has no choice but to compute it for every row. Any function, cast, or arithmetic wrapped around an indexed column disables it: `DATE(created_at)`, `id + 0`, `CAST(zip AS TEXT)`. The same logic explains the leading wildcard — a B-tree can seek to a known prefix, so `LIKE 'Ad%'` is indexable in principle, but `'%da'` has no prefix to seek to. Fixes: keep the column bare and transform the *literal* instead, or store a normalized column (or expression index) and query that.
</details>

---

### Q28 — the leftmost prefix

With `CREATE INDEX idx_o_cust_total ON orders(customer_id, total)`, which of these three can use the index?

```sql
SELECT id FROM orders WHERE customer_id = 1 AND total = 100;
SELECT id FROM orders WHERE customer_id = 1;
SELECT id FROM orders WHERE total = 100;
```

<details><summary>Answer</summary>

**The first two use it — `SEARCH … (customer_id=? AND total=?)` and `SEARCH … (customer_id=?)`. The third is a `SCAN`.**

A composite index is sorted by the first column, then by the second within each first-column value — like a phone book by last name then first name. You can look someone up by last name alone, or by both, but not by first name alone. So an index on `(a, b)` serves queries on `a` and on `a AND b`, and does nothing for `b` by itself. Column order is therefore a design decision, not a formatting one: put the column you always filter on first, and prefer equality columns before range columns. It also means an index on `(a, b)` makes a separate index on `(a)` redundant.
</details>

---

### Q29 — two columns with one name

The first query throws. What does it say, and what does the second one hand back to JavaScript?

```sql
SELECT id FROM customers c JOIN orders o ON o.customer_id = c.id;
SELECT a.sku, b.sku FROM items a JOIN items b ON b.order_id = a.order_id AND b.id > a.id;
```

<details><summary>Answer</summary>

**`Error: ambiguous column name: id`. The second returns the JavaScript object `{ sku: 'b' }` — one property, and the first column is gone.**

Both tables have an `id`, so a bare reference is a hard error — which is the good outcome, because it is caught immediately. The second is the quiet version: SQL happily returns two result columns both named `sku`, but materializing that row into a JavaScript object collapses them, last one wins, and you lose a column with no error anywhere. The same thing happens to `SELECT *` across a join. Qualify every column and alias every collision (`a.sku AS left_sku`), and alias every computed column too — an unaliased `total * 2` arrives as the property name `'total * 2'`, which changes if you reformat the query.
</details>

---

### Q30 — ordering you did not specify

Given `ORDER BY total ASC` returns `12|NULL`, `11|50`, `13|70`, `10|100`, what is wrong with each of these as a "biggest order" query?

```sql
SELECT id, total FROM orders LIMIT 1;
SELECT id, total FROM orders ORDER BY total DESC LIMIT 1;
```

<details><summary>Answer</summary>

**The first has no `ORDER BY` at all, so "first row" is undefined. The second is correct here (`10|100`) but has no tiebreaker, so it is not stable.**

A `SELECT` without `ORDER BY` returns rows in whatever order the plan produced them, and that order can change when an index is added, when the table is rewritten, or when the planner picks a different join. `LIMIT` without `ORDER BY` is therefore a coin flip with a stable-looking result in testing. Even with a sort, ties are free to come back either way round — which makes a paginated report skip and repeat rows between pages. Always add a unique tiebreaker: `ORDER BY total DESC, id DESC`. Note also where NULLs land: SQLite (and MySQL) sort them first ascending and last descending, while Postgres does the exact opposite — it treats NULL as larger than any value, so it is last ascending and first descending. Say `NULLS FIRST`/`NULLS LAST` explicitly if you care.
</details>
