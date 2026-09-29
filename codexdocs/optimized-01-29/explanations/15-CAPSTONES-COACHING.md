# 15 — capstones — coaching notes

Companion to [the exercise bank](../mastery/15-CAPSTONES-MASTERY.md). Read these notes after making a cold attempt, not before. Every problem includes four coaching layers without supplying a copyable finished answer.

## Explain

A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. In this topic, the focus is requirements, architecture, vertical delivery, integration, release safety, and technical defense.

### E01 — Explain vertical versus horizontal slicing with one feature example

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens requirements, architecture, vertical delivery, integration, release safety, and technical defense by requiring you to explain vertical versus horizontal slicing with one feature example.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Explain vertical versus horizontal slicing with one feature example.”

### E02 — Explain architectural boundaries by ownership and change, not folder names

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens requirements, architecture, vertical delivery, integration, release safety, and technical defense by requiring you to explain architectural boundaries by ownership and change, not folder names.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Explain architectural boundaries by ownership and change, not folder names.”

### E03 — Explain definition of done across code, tests, security, docs, and operations

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens requirements, architecture, vertical delivery, integration, release safety, and technical defense by requiring you to explain definition of done across code, tests, security, docs, and operations.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Trace untrusted data across every interpreter and trust boundary, demonstrate the exploit safely, and place defense at the earliest authoritative boundary. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Explain definition of done across code, tests, security, docs, and operations.”

### E04 — Explain compatibility when UI/API/database versions overlap during deployment

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens requirements, architecture, vertical delivery, integration, release safety, and technical defense by requiring you to explain compatibility when UI/API/database versions overlap during deployment.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. Happy-path fixtures hide null, zero-child, duplicate-child, and skewed-cardinality defects; an ORM does not remove those semantics.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Explain compatibility when UI/API/database versions overlap during deployment.”

### E05 — Explain how capstone evidence maps to mid-level capability rather than feature count

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens requirements, architecture, vertical delivery, integration, release safety, and technical defense by requiring you to explain how capstone evidence maps to mid-level capability rather than feature count.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Explain how capstone evidence maps to mid-level capability rather than feature count.”

## Predict

Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. In this topic, the focus is requirements, architecture, vertical delivery, integration, release safety, and technical defense.

### E06 — Predict cross-layer effects of adding one required field

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens requirements, architecture, vertical delivery, integration, release safety, and technical defense by requiring you to predict cross-layer effects of adding one required field.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Predict cross-layer effects of adding one required field.”

### E07 — Predict failures when database commits but response/network fails

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens requirements, architecture, vertical delivery, integration, release safety, and technical defense by requiring you to predict failures when database commits but response/network fails.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. A database transaction cannot roll back an external side effect, and code outside its awaited scope may escape the guarantee.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Predict failures when database commits but response/network fails.”

### E08 — Predict rollout interactions between old/new client, API, and schema

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens requirements, architecture, vertical delivery, integration, release safety, and technical defense by requiring you to predict rollout interactions between old/new client, API, and schema.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. Write the wire contract first: method, path, headers, status, body, error, retry, and disconnect behavior; verify it through a real server boundary. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. Happy-path fixtures hide null, zero-child, duplicate-child, and skewed-cardinality defects; an ORM does not remove those semantics.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Predict rollout interactions between old/new client, API, and schema.”

### E09 — Predict where one authorization omission can leak through cache/UI/API

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens requirements, architecture, vertical delivery, integration, release safety, and technical defense by requiring you to predict where one authorization omission can leak through cache/UI/API.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Predict where one authorization omission can leak through cache/UI/API.”

### E10 — Predict which tests fail after changing a domain invariant and which should not

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens requirements, architecture, vertical delivery, integration, release safety, and technical defense by requiring you to predict which tests fail after changing a domain invariant and which should not.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Predict which tests fail after changing a domain invariant and which should not.”

## Implement

Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. In this topic, the focus is requirements, architecture, vertical delivery, integration, release safety, and technical defense.

### E11 — Ship one complete vertical slice with boundary validation and durable state

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens requirements, architecture, vertical delivery, integration, release safety, and technical defense by requiring you to ship one complete vertical slice with boundary validation and durable state.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Ship one complete vertical slice with boundary validation and durable state.”

### E12 — Add observable failure behavior and recovery to that slice

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens requirements, architecture, vertical delivery, integration, release safety, and technical defense by requiring you to add observable failure behavior and recovery to that slice.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. Swallowing, stringifying, or repeatedly translating an error often loses cause and recovery meaning while making logs noisier.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Add observable failure behavior and recovery to that slice.”

### E13 — Add concurrency or idempotency protection with deterministic proof

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens requirements, architecture, vertical delivery, integration, release safety, and technical defense by requiring you to add concurrency or idempotency protection with deterministic proof.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Add concurrency or idempotency protection with deterministic proof.”

### E14 — Add accessible UI states and one browser-level golden path

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens requirements, architecture, vertical delivery, integration, release safety, and technical defense by requiring you to add accessible UI states and one browser-level golden path.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Use isolated temporary data, bounded input, safe path handling, atomic writes where required, and cleanup tests for every failure stage. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Add accessible UI states and one browser-level golden path.”

### E15 — Deploy with configuration validation, health, logs, migration step, and rollback notes

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens requirements, architecture, vertical delivery, integration, release safety, and technical defense by requiring you to deploy with configuration validation, health, logs, migration step, and rollback notes.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. A database transaction cannot roll back an external side effect, and code outside its awaited scope may escape the guarantee.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Deploy with configuration validation, health, logs, migration step, and rollback notes.”

## Test

Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. In this topic, the focus is requirements, architecture, vertical delivery, integration, release safety, and technical defense.

### E16 — Create risk matrix covering domain, HTTP, SQL, UI, security, and operations

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens requirements, architecture, vertical delivery, integration, release safety, and technical defense by requiring you to create risk matrix covering domain, HTTP, SQL, UI, security, and operations.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. Happy-path fixtures hide null, zero-child, duplicate-child, and skewed-cardinality defects; an ORM does not remove those semantics.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Create risk matrix covering domain, HTTP, SQL, UI, security, and operations.”

### E17 — Prove a transaction or constraint using real database boundary

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens requirements, architecture, vertical delivery, integration, release safety, and technical defense by requiring you to prove a transaction or constraint using real database boundary.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. A database transaction cannot roll back an external side effect, and code outside its awaited scope may escape the guarantee.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Prove a transaction or constraint using real database boundary.”

### E18 — Prove a UI race/conflict using controlled out-of-order behavior

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens requirements, architecture, vertical delivery, integration, release safety, and technical defense by requiring you to prove a UI race/conflict using controlled out-of-order behavior.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Prove a UI race/conflict using controlled out-of-order behavior.”

### E19 — Prove unauthorized data absent through direct request and rendered output

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens requirements, architecture, vertical delivery, integration, release safety, and technical defense by requiring you to prove unauthorized data absent through direct request and rendered output.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Prove unauthorized data absent through direct request and rendered output.”

### E20 — Run clean-clone install/check/migrate/deploy smoke path

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens requirements, architecture, vertical delivery, integration, release safety, and technical defense by requiring you to run clean-clone install/check/migrate/deploy smoke path.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change. Use isolated temporary data, bounded input, safe path handling, atomic writes where required, and cleanup tests for every failure stage. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. A migration proven only on an empty database says little about dirty historical data or old and new application versions overlapping.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Run clean-clone install/check/migrate/deploy smoke path.”

## Debug and review

Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. In this topic, the focus is requirements, architecture, vertical delivery, integration, release safety, and technical defense.

### E21 — Review capstone diff for scope, contracts, ownership, failures, and operability

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens requirements, architecture, vertical delivery, integration, release safety, and technical defense by requiring you to review capstone diff for scope, contracts, ownership, failures, and operability.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Review capstone diff for scope, contracts, ownership, failures, and operability.”

### E22 — Diagnose one injected cross-layer defect without cause disclosure

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens requirements, architecture, vertical delivery, integration, release safety, and technical defense by requiring you to diagnose one injected cross-layer defect without cause disclosure.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Trace untrusted data across every interpreter and trust boundary, demonstrate the exploit safely, and place defense at the earliest authoritative boundary. Draw the environment and lifetime of captured values, identify the caller that chooses `this`, and test delayed invocation or cleanup. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. Blocklists and client checks miss alternate encodings and execution contexts; defend at the authoritative boundary with allow-listed semantics.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Diagnose one injected cross-layer defect without cause disclosure.”

### E23 — Respond to ten AI review claims by verifying and classifying each

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens requirements, architecture, vertical delivery, integration, release safety, and technical defense by requiring you to respond to ten AI review claims by verifying and classifying each.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Trace property lookup and construction explicitly, then compare the change cost and invariant ownership of delegation, inheritance, and composition. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Respond to ten AI review claims by verifying and classifying each.”

### E24 — Refactor one responsibility in several green commits without behavior drift

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens requirements, architecture, vertical delivery, integration, release safety, and technical defense by requiring you to refactor one responsibility in several green commits without behavior drift.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. A database transaction cannot roll back an external side effect, and code outside its awaited scope may escape the guarantee.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Refactor one responsibility in several green commits without behavior drift.”

### E25 — Run an incident, mitigate, correct, and produce prevention/detection actions

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens requirements, architecture, vertical delivery, integration, release safety, and technical defense by requiring you to run an incident, mitigate, correct, and produce prevention/detection actions.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Run an incident, mitigate, correct, and produce prevention/detection actions.”

## Apply

Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. In this topic, the focus is requirements, architecture, vertical delivery, integration, release safety, and technical defense.

### E26 — Complete RelayDesk Gate A with linked evidence

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens requirements, architecture, vertical delivery, integration, release safety, and technical defense by requiring you to complete RelayDesk Gate A with linked evidence.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Complete RelayDesk Gate A with linked evidence.”

### E27 — Complete Gate B and demo request path from UI to database

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens requirements, architecture, vertical delivery, integration, release safety, and technical defense by requiring you to complete Gate B and demo request path from UI to database.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. Happy-path fixtures hide null, zero-child, duplicate-child, and skewed-cardinality defects; an ORM does not remove those semantics.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Complete Gate B and demo request path from UI to database.”

### E28 — Complete Gate C with auth, failures, conflicts, and deployed signals

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens requirements, architecture, vertical delivery, integration, release safety, and technical defense by requiring you to complete Gate C with auth, failures, conflicts, and deployed signals.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. Swallowing, stringifying, or repeatedly translating an error often loses cause and recovery meaning while making logs noisier.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Complete Gate C with auth, failures, conflicts, and deployed signals.”

### E29 — Process ambiguous change request through questions, slices, rollout, and review

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens requirements, architecture, vertical delivery, integration, release safety, and technical defense by requiring you to process ambiguous change request through questions, slices, rollout, and review.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change. Specify startup, message, cancellation, error, timeout, and termination contracts, then verify no handles or partial work survive shutdown. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. A migration proven only on an empty database says little about dirty historical data or old and new application versions overlapping.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Process ambiguous change request through questions, slices, rollout, and review.”

### E30 — Deliver final demo/architecture defense and create remediation for every weak rubric score

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens requirements, architecture, vertical delivery, integration, release safety, and technical defense by requiring you to deliver final demo/architecture defense and create remediation for every weak rubric score.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Deliver final demo/architecture defense and create remediation for every weak rubric score.”
