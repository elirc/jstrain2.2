# ADR-003: Sparse ranks with transactional WIP enforcement

Status: accepted. Tasks use 1024-spaced numeric ranks and deterministic ID tie-breaking. Moves perform version/WIP/rank/activity/idempotency writes under one immediate transaction. Whole-list integer rewrites were rejected because they amplify conflicts and writes; lexicographic fractional indexes were deferred as needless complexity for current scale. Repeated midpoint insertions eventually need a bounded rebalance command; that maintenance operation must be idempotent and version-aware.
