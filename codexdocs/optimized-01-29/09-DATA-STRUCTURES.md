# 09 — Data structures

## Outcome

Select structures from required operations, invariants, ordering, and scale
instead of memorizing implementations in isolation.

## The 80/20 model

- Array: ordered traversal and indexed access; costly middle insertion/search.
- Map: key lookup/update with explicit key identity.
- Set: membership and uniqueness.
- Stack/queue: LIFO/FIFO work ordering.
- Heap: repeatedly obtain highest/lowest priority.
- Tree: hierarchical relationships and ordered search in specialized forms.
- Graph: arbitrary relationships, reachability, and dependencies.

Big-O describes growth, not actual latency or correctness. Start with expected
operations and data size. Include memory, iteration order, serialization,
concurrency, and implementation simplicity.

## Common traps

- Using arrays for repeated key lookup.
- Queue implemented with repeated `shift` at large scale.
- Cache without eviction or recency invariants.
- Recursive traversal overflowing on hostile depth.
- Graph walk without a visited set.
- Choosing a complex structure before measuring need.

## Optimized exercises

1. **Selection:** choose structures for ticket lookup, unique tags, pending
   webhooks, priority queue, navigation history, and dependency traversal;
   state operations and costs.
2. **Implementation:** build an LRU cache using Map, test recency on get/set,
   overwrite, eviction, and zero capacity.
3. **Application:** identify one RelayDesk collection whose current structure
   makes a common operation unclear or slow; measure before replacing it.

## Exit gate

Given a problem, state dominant operations and constraints before naming a
structure. Explain the tradeoff of the selected and rejected option.

More reps: `../../bootcamp/09-data-structures/`.

