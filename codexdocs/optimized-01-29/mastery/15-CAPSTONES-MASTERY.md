# 15 — capstones mastery bank

Deepen: requirements, vertical slices, architecture, integration, delivery,
review, operations, change, documentation, and technical defense.

## Explain

- [ ] Explain vertical versus horizontal slicing with one feature example.
- [ ] Explain architectural boundaries by ownership and change, not folder names.
- [ ] Explain definition of done across code, tests, security, docs, and operations.
- [ ] Explain compatibility when UI/API/database versions overlap during deployment.
- [ ] Explain how capstone evidence maps to mid-level capability rather than feature count.

## Predict

- [ ] Predict cross-layer effects of adding one required field.
- [ ] Predict failures when database commits but response/network fails.
- [ ] Predict rollout interactions between old/new client, API, and schema.
- [ ] Predict where one authorization omission can leak through cache/UI/API.
- [ ] Predict which tests fail after changing a domain invariant and which should not.

## Implement

- [ ] Ship one complete vertical slice with boundary validation and durable state.
- [ ] Add observable failure behavior and recovery to that slice.
- [ ] Add concurrency or idempotency protection with deterministic proof.
- [ ] Add accessible UI states and one browser-level golden path.
- [ ] Deploy with configuration validation, health, logs, migration step, and rollback notes.

## Test

- [ ] Create risk matrix covering domain, HTTP, SQL, UI, security, and operations.
- [ ] Prove a transaction or constraint using real database boundary.
- [ ] Prove a UI race/conflict using controlled out-of-order behavior.
- [ ] Prove unauthorized data absent through direct request and rendered output.
- [ ] Run clean-clone install/check/migrate/deploy smoke path.

## Debug and review

- [ ] Review capstone diff for scope, contracts, ownership, failures, and operability.
- [ ] Diagnose one injected cross-layer defect without cause disclosure.
- [ ] Respond to ten AI review claims by verifying and classifying each.
- [ ] Refactor one responsibility in several green commits without behavior drift.
- [ ] Run an incident, mitigate, correct, and produce prevention/detection actions.

## Apply

- [ ] Complete RelayDesk Gate A with linked evidence.
- [ ] Complete Gate B and demo request path from UI to database.
- [ ] Complete Gate C with auth, failures, conflicts, and deployed signals.
- [ ] Process ambiguous change request through questions, slices, rollout, and review.
- [ ] Deliver final demo/architecture defense and create remediation for every weak rubric score.

