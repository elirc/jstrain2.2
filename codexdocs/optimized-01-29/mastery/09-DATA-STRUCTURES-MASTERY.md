# 09 — Data structures mastery bank

Deepen: operation-driven selection, arrays, maps, sets, stacks, queues, heaps,
trees, graphs, caches, invariants, complexity, and measurement.

## Explain

- [ ] Derive structure choice from dominant operations, constraints, ordering, and size.
- [ ] Compare array/object/Map/Set lookup, iteration, identity, and serialization.
- [ ] Explain stack, queue, deque, and heap ordering invariants with use cases.
- [ ] Explain tree and graph traversal, visited state, cycles, and memory tradeoffs.
- [ ] Explain LRU invariants and why Map insertion order enables a compact implementation.

## Predict

- [ ] Predict operation counts for array lookup versus indexed Map at increasing sizes.
- [ ] Trace queue and stack operations for scheduler/history scenarios.
- [ ] Trace heap insertion/removal and identify parent/child index boundaries.
- [ ] Predict DFS/BFS order, visited state, and shortest unweighted path behavior.
- [ ] Trace LRU recency/eviction across get, overwrite, missing get, and zero capacity.

## Implement

- [ ] Implement queue/deque without repeated large-array shift costs.
- [ ] Implement binary heap with comparator and invariant checker.
- [ ] Implement iterative DFS and BFS with cycle protection and path reconstruction.
- [ ] Implement bounded LRU cache with update/get recency and deletion.
- [ ] Implement priority work queue with stable ties and cancellation of queued work.

## Test

- [ ] Property-test heap invariant and sorted removal sequence.
- [ ] Test graph traversal on cycles, disconnected nodes, self-loop, and missing endpoints.
- [ ] Test LRU against a simple reference model over generated operation sequences.
- [ ] Compare memory/operation evidence for two candidate structures.
- [ ] Test stable priority ties and canceled work never executing.

## Debug and review

- [ ] Diagnose O(n) queue operations hidden inside a high-volume loop.
- [ ] Find heap off-by-one or wrong comparator direction using invariant checks.
- [ ] Diagnose graph nontermination from missing/late visited marking.
- [ ] Review cache without bound, expiry ownership, or authorization-aware keys.
- [ ] Challenge a complex structure selected without scale evidence.

## Apply

- [ ] Inventory RelayDesk collections and dominant operations with expected sizes.
- [ ] Implement bounded safe cache only where measurement justifies it.
- [ ] Choose queue structure for webhook scheduling and document ordering/fairness.
- [ ] Model one dependency or activity relationship as graph only if queries need it.
- [ ] Replace one poor structure after before/after evidence, preserving behavior.

