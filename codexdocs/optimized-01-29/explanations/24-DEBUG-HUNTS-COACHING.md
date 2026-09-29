# 24 — debug hunts — coaching notes

Companion to [the exercise bank](../mastery/24-DEBUG-HUNTS-MASTERY.md). Read these notes after making a cold attempt, not before. Every problem includes four coaching layers without supplying a copyable finished answer.

## Explain

A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. In this topic, the focus is disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence.

### E01 — Explain symptom, trigger, proximate cause, root cause, and contributing conditions

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence by requiring you to explain symptom, trigger, proximate cause, root cause, and contributing conditions.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Explain symptom, trigger, proximate cause, root cause, and contributing conditions.”

### E02 — Explain why reliable reproduction and a minimal failing case reduce debugging search space

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence by requiring you to explain why reliable reproduction and a minimal failing case reduce debugging search space.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Explain why reliable reproduction and a minimal failing case reduce debugging search space.”

### E03 — Explain binary search, differential debugging, tracing, and invariant checks

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence by requiring you to explain binary search, differential debugging, tracing, and invariant checks.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Explain binary search, differential debugging, tracing, and invariant checks.”

### E04 — Explain when logs, a debugger, profiler, heap snapshot, or packet trace is the right evidence

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence by requiring you to explain when logs, a debugger, profiler, heap snapshot, or packet trace is the right evidence.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Use isolated temporary data, bounded input, safe path handling, atomic writes where required, and cleanup tests for every failure stage. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Explain when logs, a debugger, profiler, heap snapshot, or packet trace is the right evidence.”

### E05 — Explain why a plausible fix is incomplete without regression proof and causal explanation

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence by requiring you to explain why a plausible fix is incomplete without regression proof and causal explanation.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Explain why a plausible fix is incomplete without regression proof and causal explanation.”

## Predict

Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. In this topic, the focus is disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence.

### E06 — Rank five hypotheses for a supplied symptom using likelihood, evidence, and cheapest discriminating test

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence by requiring you to rank five hypotheses for a supplied symptom using likelihood, evidence, and cheapest discriminating test.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Rank five hypotheses for a supplied symptom using likelihood, evidence, and cheapest discriminating test.”

### E07 — Predict what evidence each inserted log or breakpoint would produce under competing hypotheses

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence by requiring you to predict what evidence each inserted log or breakpoint would produce under competing hypotheses.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Predict what evidence each inserted log or breakpoint would produce under competing hypotheses.”

### E08 — Predict whether a timing change masks, exposes, or repairs a concurrency defect

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence by requiring you to predict whether a timing change masks, exposes, or repairs a concurrency defect.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Predict whether a timing change masks, exposes, or repairs a concurrency defect.”

### E09 — Predict the blast radius of fixes at call site, shared helper, boundary, and data-model levels

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence by requiring you to predict the blast radius of fixes at call site, shared helper, boundary, and data-model levels.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Predict the blast radius of fixes at call site, shared helper, boundary, and data-model levels.”

### E10 — Predict which regression test would fail before and pass after each candidate fix

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence by requiring you to predict which regression test would fail before and pass after each candidate fix.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Predict which regression test would fail before and pass after each candidate fix.”

## Implement

Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. In this topic, the focus is disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence.

### E11 — Create a minimal reproduction from a noisy failing program without deleting the defect

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence by requiring you to create a minimal reproduction from a noisy failing program without deleting the defect.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Create a minimal reproduction from a noisy failing program without deleting the defect.”

### E12 — Add structured diagnostic context that preserves errors and correlation without leaking secrets

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence by requiring you to add structured diagnostic context that preserves errors and correlation without leaking secrets.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe. Trace untrusted data across every interpreter and trust boundary, demonstrate the exploit safely, and place defense at the earliest authoritative boundary. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. Swallowing, stringifying, or repeatedly translating an error often loses cause and recovery meaning while making logs noisier.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Add structured diagnostic context that preserves errors and correlation without leaking secrets.”

### E13 — Build a deterministic scheduler seam that reproduces a race without arbitrary sleeps

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence by requiring you to build a deterministic scheduler seam that reproduces a race without arbitrary sleeps.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Build a deterministic scheduler seam that reproduces a race without arbitrary sleeps.”

### E14 — Add runtime invariant checks at the earliest boundary that knows the required truth

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence by requiring you to add runtime invariant checks at the earliest boundary that knows the required truth.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Add runtime invariant checks at the earliest boundary that knows the required truth.”

### E15 — Write a small diagnostic script that validates environment, config, connectivity, and versions

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence by requiring you to write a small diagnostic script that validates environment, config, connectivity, and versions.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Write a small diagnostic script that validates environment, config, connectivity, and versions.”

## Test

Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. In this topic, the focus is disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence.

### E16 — Convert a reported symptom into the smallest failing automated regression test

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence by requiring you to convert a reported symptom into the smallest failing automated regression test.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Convert a reported symptom into the smallest failing automated regression test.”

### E17 — Use fault injection to exercise timeout, partial write, duplicate event, and dependency failure

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence by requiring you to use fault injection to exercise timeout, partial write, duplicate event, and dependency failure.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Use fault injection to exercise timeout, partial write, duplicate event, and dependency failure.”

### E18 — Verify a fix under repetition, randomized order, constrained resources, and altered timing

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence by requiring you to verify a fix under repetition, randomized order, constrained resources, and altered timing.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Verify a fix under repetition, randomized order, constrained resources, and altered timing.”

### E19 — Add a test proving the fix did not broaden accepted input or change unrelated behavior

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence by requiring you to add a test proving the fix did not broaden accepted input or change unrelated behavior.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Add a test proving the fix did not broaden accepted input or change unrelated behavior.”

### E20 — Remove the fix temporarily and confirm the new test fails for the intended reason

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence by requiring you to remove the fix temporarily and confirm the new test fails for the intended reason.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Remove the fix temporarily and confirm the new test fails for the intended reason.”

## Debug and review

Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. In this topic, the focus is disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence.

### E21 — Hunt an off-by-one defect from symptom to causal line while recording the evidence trail

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence by requiring you to hunt an off-by-one defect from symptom to causal line while recording the evidence trail.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Hunt an off-by-one defect from symptom to causal line while recording the evidence trail.”

### E22 — Hunt an async race involving stale state, cancellation, or out-of-order completion

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence by requiring you to hunt an async race involving stale state, cancellation, or out-of-order completion.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Define freshness and ownership, force out-of-order completion or conflict, and make invalidation and rollback visible to the user. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Hunt an async race involving stale state, cancellation, or out-of-order completion.”

### E23 — Hunt a resource leak using active handles, allocation trends, and lifecycle ownership

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence by requiring you to hunt a resource leak using active handles, allocation trends, and lifecycle ownership.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Hunt a resource leak using active handles, allocation trends, and lifecycle ownership.”

### E24 — Hunt a production-only configuration or module-resolution mismatch with environment comparison

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence by requiring you to hunt a production-only configuration or module-resolution mismatch with environment comparison.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Hunt a production-only configuration or module-resolution mismatch with environment comparison.”

### E25 — Review a proposed fix that suppresses the symptom and replace it with a root-cause repair

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence by requiring you to review a proposed fix that suppresses the symptom and replace it with a root-cause repair.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Review a proposed fix that suppresses the symptom and replace it with a root-cause repair.”

## Apply

Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. In this topic, the focus is disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence.

### E26 — Complete three unfamiliar hunts under 45 minutes each and track where time was spent

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence by requiring you to complete three unfamiliar hunts under 45 minutes each and track where time was spent.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Complete three unfamiliar hunts under 45 minutes each and track where time was spent.”

### E27 — Write a concise incident report with timeline, impact, detection gap, root cause, and actions

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence by requiring you to write a concise incident report with timeline, impact, detection gap, root cause, and actions.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Write a concise incident report with timeline, impact, detection gap, root cause, and actions.”

### E28 — Lead a rubber-duck explanation without AI, then use AI to challenge only your hypotheses

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence by requiring you to lead a rubber-duck explanation without AI, then use AI to challenge only your hypotheses.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Lead a rubber-duck explanation without AI, then use AI to challenge only your hypotheses.”

### E29 — Build a reusable debugging checklist tailored to React, Node, HTTP, and persistence failures

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence by requiring you to build a reusable debugging checklist tailored to React, Node, HTTP, and persistence failures.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Write the wire contract first: method, path, headers, status, body, error, retry, and disconnect behavior; verify it through a real server boundary. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Build a reusable debugging checklist tailored to React, Node, HTTP, and persistence failures.”

### E30 — Revisit one repaired bug after a week and reproduce the diagnosis from memory

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens disciplined reproduction, narrowing, hypotheses, instrumentation, causal repair, and regression evidence by requiring you to revisit one repaired bug after a week and reproduce the diagnosis from memory.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Revisit one repaired bug after a week and reproduce the diagnosis from memory.”
