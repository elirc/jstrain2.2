# 10 — Algorithms and patterns

## Outcome

Recognize practical patterns, prove correctness on boundaries, and communicate
complexity without turning product work into puzzle theater.

## The 80/20 model

Useful patterns include frequency maps, two pointers on ordered data, sliding
windows for contiguous ranges, binary search on monotonic conditions,
depth/breadth traversal, and memoization/dynamic programming for repeated
subproblems.

Before implementation, state input constraints, invariant, termination, and
edge cases. A named pattern is a hint, not proof. Sorting changes complexity
and may change order semantics; recursion consumes stack; memoization consumes
memory and requires correct keys.

For ordinary application interviews, clear correct code, testing, and
explanation usually matter more than obscure optimality. Optimize only after
establishing a correct baseline and required scale.

## Common traps

- Binary search off-by-one and non-progressing bounds.
- Sliding window used when negative values break monotonic reasoning.
- Mutating input through sorting.
- Missing visited state in graph traversal.
- Memoization with incomplete keys or unbounded retention.

## Optimized exercises

1. **Pattern choice:** classify ten small problems, including two where the
   obvious named pattern does not apply; justify invariant and complexity.
2. **Implementation:** write lower-bound binary search and a sliding-window
   rate counter with boundary/property tests.
3. **Application:** optimize a RelayDesk list/report only after recording a
   baseline; describe why the chosen pattern preserves product semantics.

## Exit gate

Explain the invariant, termination, boundary cases, and time/space complexity
of one search and one traversal without relying on memorized code.

More reps: `../../bootcamp/10-algorithms-and-patterns/`.

