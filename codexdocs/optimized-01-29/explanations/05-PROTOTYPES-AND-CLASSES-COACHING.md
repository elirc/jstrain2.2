# 05 — Prototypes and classes — coaching notes

Companion to [the exercise bank](../mastery/05-PROTOTYPES-AND-CLASSES-MASTERY.md). Read these notes after making a cold attempt, not before. Every problem includes four coaching layers without supplying a copyable finished answer.

## Explain

A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. In this topic, the focus is JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately.

### E01 — Draw property lookup from instance through prototype chain to null

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately by requiring you to draw property lookup from instance through prototype chain to null.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Trace property lookup and construction explicitly, then compare the change cost and invariant ownership of delegation, inheritance, and composition. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Draw property lookup from instance through prototype chain to null.”

### E02 — Explain each step performed by new and constructor return edge cases

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately by requiring you to explain each step performed by `new` and constructor return edge cases.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Explain each step performed by new and constructor return edge cases.”

### E03 — Compare prototype method, instance arrow field, closure method, and bound method

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately by requiring you to compare prototype method, instance arrow field, closure method, and bound method.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Draw the environment and lifetime of captured values, identify the caller that chooses `this`, and test delayed invocation or cleanup. Trace property lookup and construction explicitly, then compare the change cost and invariant ownership of delegation, inheritance, and composition. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Compare prototype method, instance arrow field, closure method, and bound method.”

### E04 — Explain own/inherited/enumerable/configurable/writable property dimensions

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately by requiring you to explain own/inherited/enumerable/configurable/writable property dimensions.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Trace property lookup and construction explicitly, then compare the change cost and invariant ownership of delegation, inheritance, and composition. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Explain own/inherited/enumerable/configurable/writable property dimensions.”

### E05 — Choose class, closure, or plain data for five domain/lifecycle scenarios

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately by requiring you to choose class, closure, or plain data for five domain/lifecycle scenarios.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Choose class, closure, or plain data for five domain/lifecycle scenarios.”

## Predict

Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. In this topic, the focus is JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately.

### E06 — Predict own keys, in, hasOwn, enumeration, and lookup for a prototype example

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately by requiring you to predict own keys, `in`, `hasOwn`, enumeration, and lookup for a prototype example.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Trace property lookup and construction explicitly, then compare the change cost and invariant ownership of delegation, inheritance, and composition. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Predict own keys, in, hasOwn, enumeration, and lookup for a prototype example.”

### E07 — Predict receivers through inheritance, super, detached methods, and callbacks

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately by requiring you to predict receivers through inheritance, `super`, detached methods, and callbacks.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Draw the environment and lifetime of captured values, identify the caller that chooses `this`, and test delayed invocation or cleanup. Trace property lookup and construction explicitly, then compare the change cost and invariant ownership of delegation, inheritance, and composition. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Predict receivers through inheritance, super, detached methods, and callbacks.”

### E08 — Predict instanceof and constructor identity across prototype replacement and realms

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately by requiring you to predict `instanceof` and constructor identity across prototype replacement and realms.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Trace property lookup and construction explicitly, then compare the change cost and invariant ownership of delegation, inheritance, and composition. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Predict instanceof and constructor identity across prototype replacement and realms.”

### E09 — Predict getter/setter behavior with assignment, spread, and serialization

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately by requiring you to predict getter/setter behavior with assignment, spread, and serialization.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Predict getter/setter behavior with assignment, spread, and serialization.”

### E10 — Predict sharing of prototype arrays versus per-instance fields

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately by requiring you to predict sharing of prototype arrays versus per-instance fields.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Trace property lookup and construction explicitly, then compare the change cost and invariant ownership of delegation, inheritance, and composition. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Predict sharing of prototype arrays versus per-instance fields.”

## Implement

Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. In this topic, the focus is JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately.

### E11 — Recreate a minimal new helper and state its intentional limitations

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately by requiring you to recreate a minimal `new` helper and state its intentional limitations.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Recreate a minimal new helper and state its intentional limitations.”

### E12 — Implement an invariant-protecting class with private fields and explicit serialization

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately by requiring you to implement an invariant-protecting class with private fields and explicit serialization.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Trace property lookup and construction explicitly, then compare the change cost and invariant ownership of delegation, inheritance, and composition. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Implement an invariant-protecting class with private fields and explicit serialization.”

### E13 — Implement the same stateful API with closure composition and compare memory/testability

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately by requiring you to implement the same stateful API with closure composition and compare memory/testability.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Write the wire contract first: method, path, headers, status, body, error, retry, and disconnect behavior; verify it through a real server boundary. Draw the environment and lifetime of captured values, identify the caller that chooses `this`, and test delayed invocation or cleanup. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. Treating every failure as 400 or 500 erases retry and conflict semantics; types also do not validate bytes received over the wire.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Implement the same stateful API with closure composition and compare memory/testability.”

### E14 — Implement strategy composition without inheritance

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately by requiring you to implement strategy composition without inheritance.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Trace property lookup and construction explicitly, then compare the change cost and invariant ownership of delegation, inheritance, and composition. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Implement strategy composition without inheritance.”

### E15 — Implement a small error hierarchy that preserves cause and useful classification

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately by requiring you to implement a small error hierarchy that preserves cause and useful classification.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe. Trace property lookup and construction explicitly, then compare the change cost and invariant ownership of delegation, inheritance, and composition. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. Swallowing, stringifying, or repeatedly translating an error often loses cause and recovery meaning while making logs noisier.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Implement a small error hierarchy that preserves cause and useful classification.”

## Test

Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. In this topic, the focus is JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately.

### E16 — Test property ownership/descriptors rather than only resulting values

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately by requiring you to test property ownership/descriptors rather than only resulting values.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Test property ownership/descriptors rather than only resulting values.”

### E17 — Test detached and rebound method behavior deliberately

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately by requiring you to test detached and rebound method behavior deliberately.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Test detached and rebound method behavior deliberately.”

### E18 — Prove instances do not share mutable defaults

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately by requiring you to prove instances do not share mutable defaults.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Prove instances do not share mutable defaults.”

### E19 — Test serialization/deserialization re-establishes invariants instead of trusting shape

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately by requiring you to test serialization/deserialization re-establishes invariants instead of trusting shape.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Test serialization/deserialization re-establishes invariants instead of trusting shape.”

### E20 — Write substitutability tests for two strategy implementations

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately by requiring you to write substitutability tests for two strategy implementations.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Write substitutability tests for two strategy implementations.”

## Debug and review

Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. In this topic, the focus is JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately.

### E21 — Diagnose shared mutable prototype state

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately by requiring you to diagnose shared mutable prototype state.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Trace property lookup and construction explicitly, then compare the change cost and invariant ownership of delegation, inheritance, and composition. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Diagnose shared mutable prototype state.”

### E22 — Review inheritance used only for code reuse and propose composition if clearer

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately by requiring you to review inheritance used only for code reuse and propose composition if clearer.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Trace property lookup and construction explicitly, then compare the change cost and invariant ownership of delegation, inheritance, and composition. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Review inheritance used only for code reuse and propose composition if clearer.”

### E23 — Find a private-field instance crossing a worker/JSON boundary incorrectly

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately by requiring you to find a private-field instance crossing a worker/JSON boundary incorrectly.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Specify startup, message, cancellation, error, timeout, and termination contracts, then verify no handles or partial work survive shutdown. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. Forcing process exit can discard output and partial work; background success is incomplete until handles and children are owned and drained.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Find a private-field instance crossing a worker/JSON boundary incorrectly.”

### E24 — Diagnose an overridden method called during base construction

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately by requiring you to diagnose an overridden method called during base construction.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Diagnose an overridden method called during base construction.”

### E25 — Review getters for hidden expensive or failure-prone behavior

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately by requiring you to review getters for hidden expensive or failure-prone behavior.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. Swallowing, stringifying, or repeatedly translating an error often loses cause and recovery meaning while making logs noisier.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Review getters for hidden expensive or failure-prone behavior.”

## Apply

Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. In this topic, the focus is JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately.

### E26 — Justify RelayDesk ticket as class or plain domain value with invariant evidence

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately by requiring you to justify RelayDesk ticket as class or plain domain value with invariant evidence.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Trace property lookup and construction explicitly, then compare the change cost and invariant ownership of delegation, inheritance, and composition. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Justify RelayDesk ticket as class or plain domain value with invariant evidence.”

### E27 — Review service methods passed as framework callbacks for receiver safety

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately by requiring you to review service methods passed as framework callbacks for receiver safety.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Draw the environment and lifetime of captured values, identify the caller that chooses `this`, and test delayed invocation or cleanup. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Review service methods passed as framework callbacks for receiver safety.”

### E28 — Replace one unnecessary inheritance relationship with a small injected strategy

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately by requiring you to replace one unnecessary inheritance relationship with a small injected strategy.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Trace untrusted data across every interpreter and trust boundary, demonstrate the exploit safely, and place defense at the earliest authoritative boundary. Trace property lookup and construction explicitly, then compare the change cost and invariant ownership of delegation, inheritance, and composition. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. Blocklists and client checks miss alternate encodings and execution contexts; defend at the authoritative boundary with allow-listed semantics.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Replace one unnecessary inheritance relationship with a small injected strategy.”

### E29 — Define explicit domain-to-transport serialization for one behavior-rich object

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately by requiring you to define explicit domain-to-transport serialization for one behavior-rich object.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Define explicit domain-to-transport serialization for one behavior-rich object.”

### E30 — Record one class/closure/plain-data decision and revisit after a feature change

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens JavaScript delegation, object construction, encapsulation, and choosing composition or inheritance deliberately by requiring you to record one class/closure/plain-data decision and revisit after a feature change.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Draw the environment and lifetime of captured values, identify the caller that chooses `this`, and test delayed invocation or cleanup. Trace property lookup and construction explicitly, then compare the change cost and invariant ownership of delegation, inheritance, and composition. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Record one class/closure/plain-data decision and revisit after a feature change.”
