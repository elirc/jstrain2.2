# 22 — SQL joins

## Outcome

Combine relational data without accidentally removing parent rows, multiplying
aggregates, or creating N+1 application queries.

## The 80/20 model

An inner join keeps matching pairs. A left join preserves every left row and
fills missing right values with null. Filtering a nullable right-side column in
`WHERE` can remove unmatched rows and effectively turn a left join into an
inner join; place relationship filters deliberately in `ON` or handle null.

Joining multiple one-to-many relationships creates combinations of child rows.
Aggregating afterward can double-count. Pre-aggregate children, use correlated
subqueries, or query separately based on required result and performance.

N+1 occurs when one list query triggers one child query per result. Projection,
joins, batching, or data-loader patterns can correct it. Measure query count
and preserve authorization/filter semantics.

## Common traps

- Wrong join direction/type.
- `WHERE` filter erasing unmatched left rows.
- Counts inflated by join fan-out.
- Selecting all columns with ambiguous names.
- Grouping by insufficient/nonportable columns.
- Fixing N+1 with one enormous incorrect join.

## Optimized exercises

1. **Prediction:** draw rows produced by inner/left joins for tickets with
   zero, one, and multiple comments; predict nulls and counts.
2. **Query:** produce ticket counts of public/internal comments and activities
   without losing empty tickets or multiplying aggregates.
3. **Application:** measure query count for RelayDesk ticket list/detail,
   remove one N+1 pattern, and prove authorization/output remain correct.

## Exit gate

Given a join report, predict row cardinality before aggregation and explain how
unmatched rows and multiple child relationships behave.

More reps: `../../bootcamp/22-sql-joins/`.

