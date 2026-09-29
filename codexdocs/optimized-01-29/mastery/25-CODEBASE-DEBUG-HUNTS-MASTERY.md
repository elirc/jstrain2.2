# 25 — codebase debug hunts mastery bank

Deepen: navigating unfamiliar repositories, tracing ownership, understanding contracts, finding regressions, and making safe minimal fixes.

## Explain

- [ ] Explain how entry points, dependency direction, ownership, and data flow form a codebase map.
- [ ] Explain the difference between local correctness and compatibility with repository-wide contracts.
- [ ] Explain how version history, blame, tests, and documentation provide debugging evidence.
- [ ] Explain characterization tests and when they are appropriate around legacy behavior.
- [ ] Explain how to keep a fix small without ignoring a shared root cause.

## Predict

- [ ] Given a repository tree, predict the likely runtime entry points, boundaries, and change hotspots.
- [ ] Predict downstream consumers affected by changing one exported type, route, event, or schema field.
- [ ] Predict which configuration layer wins across defaults, files, environment, arguments, and runtime overrides.
- [ ] Predict test and build failures caused by a module-cycle or package-boundary change.
- [ ] Predict rollout risks when old and new components coexist during a staged release.

## Implement

- [ ] Produce a one-page codebase map using searches, manifests, scripts, imports, and runtime tracing.
- [ ] Add a characterization test around poorly documented behavior before modifying it.
- [ ] Instrument one cross-layer request with a correlation ID and useful boundary context.
- [ ] Refactor a tangled dependency behind a seam while keeping behavior unchanged.
- [ ] Implement a minimal fix plus migration or compatibility adapter where the wider contract requires it.

## Test

- [ ] Run the smallest relevant test first, then widening rings through package, integration, and full verification.
- [ ] Test every known consumer of a changed shared contract rather than trusting compilation alone.
- [ ] Test configuration behavior in development, test, production-like, missing, and malformed cases.
- [ ] Test old/new data and component combinations for a backwards-compatible change.
- [ ] Verify build artifacts and the actual production entry point, not only source-level tests.

## Debug and review

- [ ] Trace a UI symptom through state, network, domain, repository, and data until ownership is clear.
- [ ] Use history to locate a regression window, then confirm the causal change experimentally.
- [ ] Diagnose a failure caused by duplicated library versions or incompatible package resolution.
- [ ] Find a hidden global or singleton that makes tests pass alone and fail together.
- [ ] Review a broad patch and separate essential fix, incidental cleanup, and risky behavior changes.

## Apply

- [ ] Enter an unfamiliar module and deliver a tested bug fix with a written dependency map.
- [ ] Write a change-impact checklist covering contracts, data, deployment, observability, and rollback.
- [ ] Create a code-review note explaining root cause, evidence, scope, alternatives, and remaining risk.
- [ ] Rehearse a production hotfix: reproduce, patch, verify, deploy safely, monitor, and revert.
- [ ] Compare your first navigation path with the eventual root cause and improve your search heuristics.
