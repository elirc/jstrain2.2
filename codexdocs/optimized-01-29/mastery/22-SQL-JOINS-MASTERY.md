# 22 — SQL joins mastery bank

Deepen: relational reasoning, join semantics, aggregation, nulls, query plans, indexes, correctness, and API-facing data access.

## Explain

- [ ] Explain inner, left, right, full, cross, and self joins using set/cardinality examples.
- [ ] Explain how predicates in `ON` versus `WHERE` change an outer join.
- [ ] Explain one-to-one, one-to-many, and many-to-many schemas and their join multiplicity.
- [ ] Explain SQL `NULL` and three-valued logic in comparisons, filters, and aggregates.
- [ ] Explain nested-loop, hash, and merge joins at a conceptual query-plan level.

## Predict

- [ ] Predict exact rows from inner and left joins over a small table containing unmatched keys.
- [ ] Predict duplicate multiplication when joining two one-to-many relationships before aggregation.
- [ ] Predict results for `COUNT(*)`, `COUNT(column)`, `SUM`, and grouped null values.
- [ ] Predict which rows disappear when a right-table predicate moves from `ON` to `WHERE`.
- [ ] Predict how composite-index column order affects three supplied join-and-filter queries.

## Implement

- [ ] Write joins that list every customer with ticket count, including customers with zero tickets.
- [ ] Write a many-to-many query for tickets and tags without accidental duplicate ticket totals.
- [ ] Write a self join or recursive query that represents assignment or category hierarchy.
- [ ] Write an anti-join and semi-join using both `EXISTS` and join forms; compare clarity.
- [ ] Build a parameterized repository query with joins, filters, pagination, and deterministic ordering.

## Test

- [ ] Create a minimal fixture covering matches, nonmatches, null keys, duplicates, and empty tables.
- [ ] Test query cardinality and aggregate values rather than checking only a happy-path row.
- [ ] Test pagination stability when sort keys tie and concurrent rows are inserted.
- [ ] Test repository queries against SQL injection attempts and wildcard-containing search input.
- [ ] Capture and interpret query plans before and after adding a justified index.

## Debug and review

- [ ] Repair an outer join accidentally converted to an inner join by a `WHERE` predicate.
- [ ] Diagnose inflated sums caused by joining multiple child collections before grouping.
- [ ] Diagnose an N+1 repository access pattern and replace it with bounded querying.
- [ ] Review a query using `SELECT *` for contract drift, ambiguity, bandwidth, and index coverage.
- [ ] Diagnose a slow join using row estimates, actual cardinality, indexes, and filter selectivity.

## Apply

- [ ] Design RelayDesk users, tickets, comments, and tags with explicit keys and constraints.
- [ ] Implement a ticket-list query returning assignee, comment count, and tags in a stable shape.
- [ ] Add optional filters without dynamic string interpolation or incorrect null semantics.
- [ ] Document the query contract, expected scale, indexes, and worst-case behavior.
- [ ] Explain the plan and validate performance with realistic, skewed seed data.
