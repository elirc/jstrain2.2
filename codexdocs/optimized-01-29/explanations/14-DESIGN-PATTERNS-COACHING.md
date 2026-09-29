# 14 — software design patterns — coaching notes

Companion to [the exercise bank](../mastery/14-DESIGN-PATTERNS-MASTERY.md). Read these notes after making a cold attempt, not before. Every problem includes four coaching layers without supplying a copyable finished answer.

## Explain

A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. In this topic, the focus is design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned.

### E01 — For ten patterns, name force solved, added cost, and simplest implementation form

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned by requiring you to for ten patterns, name force solved, added cost, and simplest implementation form.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “For ten patterns, name force solved, added cost, and simplest implementation form.”

### E02 — Compare strategy function/object/class and selection ownership

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned by requiring you to compare strategy function/object/class and selection ownership.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Trace property lookup and construction explicitly, then compare the change cost and invariant ownership of delegation, inheritance, and composition. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Compare strategy function/object/class and selection ownership.”

### E03 — Explain observer delivery ordering, error isolation, unsubscribe, and backpressure limits

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned by requiring you to explain observer delivery ordering, error isolation, unsubscribe, and backpressure limits.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Use bounded data, a deliberately slow consumer, error injection at each stage, and memory measurements rather than assuming piping is automatically safe. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. A stream-shaped API can still buffer the entire payload; verify bounded memory and cleanup instead of trusting the abstraction name.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Explain observer delivery ordering, error isolation, unsubscribe, and backpressure limits.”

### E04 — Explain adapter boundary versus leaking external/provider models inward

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned by requiring you to explain adapter boundary versus leaking external/provider models inward.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Explain adapter boundary versus leaking external/provider models inward.”

### E05 — Explain dependency injection as construction separation, not global service lookup

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned by requiring you to explain dependency injection as construction separation, not global service lookup.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Trace untrusted data across every interpreter and trust boundary, demonstrate the exploit safely, and place defense at the earliest authoritative boundary. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. Blocklists and client checks miss alternate encodings and execution contexts; defend at the authoritative boundary with allow-listed semantics.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Explain dependency injection as construction separation, not global service lookup.”

## Predict

Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. In this topic, the focus is design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned.

### E06 — Trace decorator order for logging, timeout, retry, auth, and caching wrappers

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned by requiring you to trace decorator order for logging, timeout, retry, auth, and caching wrappers.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Trace decorator order for logging, timeout, retry, auth, and caching wrappers.”

### E07 — Predict observer mutation/reentrancy behavior during dispatch

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned by requiring you to predict observer mutation/reentrancy behavior during dispatch.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Predict observer mutation/reentrancy behavior during dispatch.”

### E08 — Trace command do/undo failure and grouped-command partial failure

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned by requiring you to trace command do/undo failure and grouped-command partial failure.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Trace command do/undo failure and grouped-command partial failure.”

### E09 — Predict state-machine illegal transitions under scattered versus centralized rules

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned by requiring you to predict state-machine illegal transitions under scattered versus centralized rules.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Predict state-machine illegal transitions under scattered versus centralized rules.”

### E10 — Predict repository abstraction changes when storage/query capability evolves

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned by requiring you to predict repository abstraction changes when storage/query capability evolves.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. Happy-path fixtures hide null, zero-child, duplicate-child, and skewed-cardinality defects; an ORM does not remove those semantics.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Predict repository abstraction changes when storage/query capability evolves.”

## Implement

Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. In this topic, the focus is design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned.

### E11 — Implement retry and authorization as explicit strategies with contract tests

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned by requiring you to implement retry and authorization as explicit strategies with contract tests.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Implement retry and authorization as explicit strategies with contract tests.”

### E12 — Implement observer with disposer, defensive iteration, error policy, and once

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned by requiring you to implement observer with disposer, defensive iteration, error policy, and once.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. Swallowing, stringifying, or repeatedly translating an error often loses cause and recovery meaning while making logs noisier.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Implement observer with disposer, defensive iteration, error policy, and once.”

### E13 — Implement adapter translating provider response/errors into local domain contract

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned by requiring you to implement adapter translating provider response/errors into local domain contract.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Implement adapter translating provider response/errors into local domain contract.”

### E14 — Implement command-based reversible edit with bounded history and failure policy

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned by requiring you to implement command-based reversible edit with bounded history and failure policy.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. Swallowing, stringifying, or repeatedly translating an error often loses cause and recovery meaning while making logs noisier.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Implement command-based reversible edit with bounded history and failure policy.”

### E15 — Build explicit composition root constructing app dependencies and lifecycle

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned by requiring you to build explicit composition root constructing app dependencies and lifecycle.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Build explicit composition root constructing app dependencies and lifecycle.”

## Test

Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. In this topic, the focus is design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned.

### E16 — Contract-test two strategy/adapter implementations without private-call coupling

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned by requiring you to contract-test two strategy/adapter implementations without private-call coupling.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Contract-test two strategy/adapter implementations without private-call coupling.”

### E17 — Test decorator order changes observable behavior and document chosen sequence

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned by requiring you to test decorator order changes observable behavior and document chosen sequence.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Test decorator order changes observable behavior and document chosen sequence.”

### E18 — Test observer reentrancy, unregister, throwing listener, and cleanup

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned by requiring you to test observer reentrancy, unregister, throwing listener, and cleanup.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Test observer reentrancy, unregister, throwing listener, and cleanup.”

### E19 — Exhaustively test state transition table and newly added state compiler pressure

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned by requiring you to exhaustively test state transition table and newly added state compiler pressure.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Exhaustively test state transition table and newly added state compiler pressure.”

### E20 — Test composition root startup failure and reverse-order resource cleanup

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned by requiring you to test composition root startup failure and reverse-order resource cleanup.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Test composition root startup failure and reverse-order resource cleanup.”

## Debug and review

Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. In this topic, the focus is design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned.

### E21 — Identify pattern-shaped code whose force no longer exists and simplify it

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned by requiring you to identify pattern-shaped code whose force no longer exists and simplify it.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Identify pattern-shaped code whose force no longer exists and simplify it.”

### E22 — Diagnose event bus hiding important synchronous dependency/order

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned by requiring you to diagnose event bus hiding important synchronous dependency/order.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers. Define event payload, ordering, reentrancy, subscription ownership, and removal; test duplicate listeners and failure isolation. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Diagnose event bus hiding important synchronous dependency/order.”

### E23 — Review repository that only renames persistence methods without stabilizing contract

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned by requiring you to review repository that only renames persistence methods without stabilizing contract.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. Happy-path fixtures hide null, zero-child, duplicate-child, and skewed-cardinality defects; an ORM does not remove those semantics.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Review repository that only renames persistence methods without stabilizing contract.”

### E24 — Find service locator access that hides dependencies from tests/review

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned by requiring you to find service locator access that hides dependencies from tests/review.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Find service locator access that hides dependencies from tests/review.”

### E25 — Review inheritance hierarchy and propose composition only with concrete benefit

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned by requiring you to review inheritance hierarchy and propose composition only with concrete benefit.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Trace property lookup and construction explicitly, then compare the change cost and invariant ownership of delegation, inheritance, and composition. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Review inheritance hierarchy and propose composition only with concrete benefit.”

## Apply

Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. In this topic, the focus is design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned.

### E26 — Name patterns already present in RelayDesk and document actual tradeoffs

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned by requiring you to name patterns already present in RelayDesk and document actual tradeoffs.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Name patterns already present in RelayDesk and document actual tradeoffs.”

### E27 — Add smallest adapter for webhook/provider isolation

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned by requiring you to add smallest adapter for webhook/provider isolation.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Add smallest adapter for webhook/provider isolation.”

### E28 — Centralize ticket lifecycle as explicit state policy

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned by requiring you to centralize ticket lifecycle as explicit state policy.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Centralize ticket lifecycle as explicit state policy.”

### E29 — Review wrapper order for request logging/auth/error/retry/cache behavior

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned by requiring you to review wrapper order for request logging/auth/error/retry/cache behavior.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Review wrapper order for request logging/auth/error/retry/cache behavior.”

### E30 — Remove or reject one premature abstraction and explain saved complexity

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens design vocabulary, dependency management, change pressure, and using patterns only when their tradeoff is earned by requiring you to remove or reject one premature abstraction and explain saved complexity.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. Swallowing, stringifying, or repeatedly translating an error often loses cause and recovery meaning while making logs noisier.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Remove or reject one premature abstraction and explain saved complexity.”
