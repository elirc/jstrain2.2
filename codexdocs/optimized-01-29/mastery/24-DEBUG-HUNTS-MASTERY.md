# 24 — debug hunts mastery bank

Deepen: reproduction, narrowing, hypotheses, instrumentation, root-cause analysis, regression proof, and incident learning.

## Explain

- [ ] Explain symptom, trigger, proximate cause, root cause, and contributing conditions.
- [ ] Explain why reliable reproduction and a minimal failing case reduce debugging search space.
- [ ] Explain binary search, differential debugging, tracing, and invariant checks.
- [ ] Explain when logs, a debugger, profiler, heap snapshot, or packet trace is the right evidence.
- [ ] Explain why a plausible fix is incomplete without regression proof and causal explanation.

## Predict

- [ ] Rank five hypotheses for a supplied symptom using likelihood, evidence, and cheapest discriminating test.
- [ ] Predict what evidence each inserted log or breakpoint would produce under competing hypotheses.
- [ ] Predict whether a timing change masks, exposes, or repairs a concurrency defect.
- [ ] Predict the blast radius of fixes at call site, shared helper, boundary, and data-model levels.
- [ ] Predict which regression test would fail before and pass after each candidate fix.

## Implement

- [ ] Create a minimal reproduction from a noisy failing program without deleting the defect.
- [ ] Add structured diagnostic context that preserves errors and correlation without leaking secrets.
- [ ] Build a deterministic scheduler seam that reproduces a race without arbitrary sleeps.
- [ ] Add runtime invariant checks at the earliest boundary that knows the required truth.
- [ ] Write a small diagnostic script that validates environment, config, connectivity, and versions.

## Test

- [ ] Convert a reported symptom into the smallest failing automated regression test.
- [ ] Use fault injection to exercise timeout, partial write, duplicate event, and dependency failure.
- [ ] Verify a fix under repetition, randomized order, constrained resources, and altered timing.
- [ ] Add a test proving the fix did not broaden accepted input or change unrelated behavior.
- [ ] Remove the fix temporarily and confirm the new test fails for the intended reason.

## Debug and review

- [ ] Hunt an off-by-one defect from symptom to causal line while recording the evidence trail.
- [ ] Hunt an async race involving stale state, cancellation, or out-of-order completion.
- [ ] Hunt a resource leak using active handles, allocation trends, and lifecycle ownership.
- [ ] Hunt a production-only configuration or module-resolution mismatch with environment comparison.
- [ ] Review a proposed fix that suppresses the symptom and replace it with a root-cause repair.

## Apply

- [ ] Complete three unfamiliar hunts under 45 minutes each and track where time was spent.
- [ ] Write a concise incident report with timeline, impact, detection gap, root cause, and actions.
- [ ] Lead a rubber-duck explanation without AI, then use AI to challenge only your hypotheses.
- [ ] Build a reusable debugging checklist tailored to React, Node, HTTP, and persistence failures.
- [ ] Revisit one repaired bug after a week and reproduce the diagnosis from memory.
