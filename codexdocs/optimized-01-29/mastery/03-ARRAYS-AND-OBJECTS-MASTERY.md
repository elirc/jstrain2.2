# 03 — Arrays and objects mastery bank

Deepen: transformation intent, ownership, indexing, joins, stable ordering,
grouping, immutable updates, normalization, complexity, and reporting.

## Explain

- [ ] Explain map/filter/find/some/every/reduce by business intent rather than syntax.
- [ ] Explain mutating versus copying array operations and ownership consequences.
- [ ] Compare Object, Map, and Set for keys, ordering, identity, and serialization.
- [ ] Explain normalized versus nested data and the cost of keeping both synchronized.
- [ ] Derive complexity for nested lookup, indexed join, sorting, and grouped aggregation.

## Predict

- [ ] Predict sparse-array behavior across map, for-of, keys, spread, and JSON.
- [ ] Predict sort results for numbers, missing comparator, ties, mutation, and locale strings.
- [ ] Predict object spread with symbols, accessors, undefined, prototypes, and key collisions.
- [ ] Predict grouping/join output with duplicate keys, missing rows, and empty inputs.
- [ ] Predict identities after replace, insert, delete, reorder, and nested update operations.

## Implement

- [ ] Implement stable multi-field sorting without mutating input.
- [ ] Implement groupBy and indexBy with explicit duplicate-key policy.
- [ ] Implement inner and left in-memory joins using indexes rather than nested search.
- [ ] Implement normalized ticket/comment storage and immutable denormalized selection.
- [ ] Implement a report pipeline with validation, filtering, grouping, percentile, and formatting stages.

## Test

- [ ] Write tests proving inputs and unchanged nested branches retain identity.
- [ ] Create fixtures exposing duplicate keys, stable ties, missing relations, and empty groups.
- [ ] Compare operation counts for quadratic and indexed joins at growing sizes.
- [ ] Write property tests for normalize/denormalize round-trip under stated constraints.
- [ ] Test a report pipeline against reordered input, invalid rows, and numeric boundaries.

## Debug and review

- [ ] Diagnose caller-owned data mutated by sort or splice.
- [ ] Review a reduce accumulator that sometimes returns the wrong object.
- [ ] Find a duplicate-key overwrite hidden by an object lookup table.
- [ ] Diagnose stale denormalized data after one entity update.
- [ ] Review a clever chain and rewrite only if domain intent becomes clearer.

## Apply

- [ ] Build RelayDesk queue transformation with explicit parse/filter/order/page stages.
- [ ] Measure and remove one repeated linear lookup in a project data path.
- [ ] Define duplicate and missing-relation policy in one response mapper.
- [ ] Audit one React state update for mutation and structural sharing.
- [ ] Produce a ticket activity summary with deterministic ordering and explain complexity.

