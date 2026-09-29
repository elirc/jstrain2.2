# 03 — Arrays and objects

## Outcome

Transform, index, group, sort, and update data while preserving ownership and
making complexity visible.

## The 80/20 model

Choose collection operations by intent: `map` changes each item, `filter`
selects, `find` stops at one, `some/every` answer predicates, and `reduce`
combines when no clearer operation fits. A pipeline should make the business
question readable, not showcase chained methods.

Sorting mutates the array unless using a copying alternative or explicit copy.
Objects are convenient records; `Map` is often clearer for dynamic keys,
non-string identity, and frequent updates. `Set` expresses uniqueness and
membership.

Efficient code often performs one indexing pass and one joining pass rather
than repeated nested searches. Complexity matters when data size makes it
observable, not as premature cleverness.

## Common traps

- Mutating caller-owned arrays with `sort` or `splice`.
- Quadratic joins using `array.find` inside `map`.
- `reduce` accumulators mutated or returned inconsistently.
- Object keys coercing IDs to strings unexpectedly.
- Deep merging arrays/objects without a defined merge policy.

## Optimized exercises

1. **Implementation:** from tickets and users, produce a status summary and
   top assignees without mutating inputs; define tie ordering.
2. **Performance:** implement a nested-search join and indexed join, verify
   identical output, then compare operation counts as data grows.
3. **Application:** implement a RelayDesk queue transformation as pure
   parse/filter/sort/page stages, with tests for stable ties and empty input.

## Exit gate

Explain ownership, ordering, missing-key behavior, and big-O cost of your queue
transformation without referring to method names alone.

More reps: `../../bootcamp/03-arrays-and-objects/`.

