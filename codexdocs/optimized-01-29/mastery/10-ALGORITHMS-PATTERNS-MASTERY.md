# 10 — Algorithms and patterns mastery bank

Deepen: invariants, complexity, frequency maps, two pointers, sliding windows,
binary search, traversal, recursion, greedy choices, memoization, and DP-lite.

## Explain

- [ ] Explain preconditions/invariants for frequency map, two pointers, and sliding window.
- [ ] Explain binary search as monotonic predicate search, not only item lookup.
- [ ] Compare DFS/BFS and recursive/iterative traversal by required output/resources.
- [ ] Explain when greedy choice needs proof and when memoization trades memory for work.
- [ ] Explain time/space complexity using input size and dominant operation.

## Predict

- [ ] Trace two-pointer dedupe/intersection on sorted input with duplicates.
- [ ] Trace fixed/variable sliding windows and identify negative-value counterexample.
- [ ] Trace lower/upper-bound binary search across empty, missing, duplicate, and edge values.
- [ ] Predict traversal order and frontier/stack size on balanced and skewed structures.
- [ ] Predict recursive-call explosion and memoized state count for repeated subproblems.

## Implement

- [ ] Implement count/group/top-k pipeline using frequency Map and stable tie policy.
- [ ] Implement two-pointer interval merge or sorted intersection without input mutation.
- [ ] Implement longest bounded window with documented monotonic assumptions.
- [ ] Implement lower-bound insertion index with loop invariant comments.
- [ ] Implement memoized small scheduling/count problem and bottom-up alternative.

## Test

- [ ] Property-test lower-bound partition invariant and insertion ordering.
- [ ] Test sliding-window precondition violations and decide reject/fallback behavior.
- [ ] Generate traversal cases for empty, one, cycle, deep, and wide data.
- [ ] Compare naive and optimized algorithms against same reference outputs.
- [ ] Measure growth at several sizes and relate evidence to complexity claim.

## Debug and review

- [ ] Diagnose binary-search bounds that stall or skip final candidate.
- [ ] Review sliding window applied where removing items does not restore validity monotonically.
- [ ] Find input mutation introduced by convenient sort before an algorithm.
- [ ] Diagnose memoization collision/incomplete state key.
- [ ] Reject an asymptotically clever solution whose complexity/maintenance cost is unnecessary.

## Apply

- [ ] Use frequency/index patterns for one RelayDesk report and explain tie semantics.
- [ ] Implement keyset/query boundary search or client insertion with invariant tests.
- [ ] Measure one slow transformation before selecting an algorithmic change.
- [ ] Replace recursion for hostile-depth input where stack safety matters.
- [ ] Present one optimization PR with baseline, invariant, correctness proof, and tradeoff.

