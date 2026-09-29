# 03 — Arrays and objects — coaching notes

Companion to [the exercise bank](../mastery/03-ARRAYS-AND-OBJECTS-MASTERY.md). Read these notes after making a cold attempt, not before. Every problem includes four coaching layers without supplying a copyable finished answer.

## Explain

A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. In this topic, the focus is collection transformations, identity, mutation, and data-shape contracts across application layers.

### E01 — Explain map/filter/find/some/every/reduce by business intent rather than syntax

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens collection transformations, identity, mutation, and data-shape contracts across application layers by requiring you to explain map/filter/find/some/every/reduce by business intent rather than syntax.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Explain map/filter/find/some/every/reduce by business intent rather than syntax.”

### E02 — Explain mutating versus copying array operations and ownership consequences

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens collection transformations, identity, mutation, and data-shape contracts across application layers by requiring you to explain mutating versus copying array operations and ownership consequences.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Explain mutating versus copying array operations and ownership consequences.”

### E03 — Compare Object, Map, and Set for keys, ordering, identity, and serialization

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens collection transformations, identity, mutation, and data-shape contracts across application layers by requiring you to compare Object, Map, and Set for keys, ordering, identity, and serialization.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Compare Object, Map, and Set for keys, ordering, identity, and serialization.”

### E04 — Explain normalized versus nested data and the cost of keeping both synchronized

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens collection transformations, identity, mutation, and data-shape contracts across application layers by requiring you to explain normalized versus nested data and the cost of keeping both synchronized.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Explain normalized versus nested data and the cost of keeping both synchronized.”

### E05 — Derive complexity for nested lookup, indexed join, sorting, and grouped aggregation

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens collection transformations, identity, mutation, and data-shape contracts across application layers by requiring you to derive complexity for nested lookup, indexed join, sorting, and grouped aggregation.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. Happy-path fixtures hide null, zero-child, duplicate-child, and skewed-cardinality defects; an ORM does not remove those semantics.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Derive complexity for nested lookup, indexed join, sorting, and grouped aggregation.”

## Predict

Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. In this topic, the focus is collection transformations, identity, mutation, and data-shape contracts across application layers.

### E06 — Predict sparse-array behavior across map, for-of, keys, spread, and JSON

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens collection transformations, identity, mutation, and data-shape contracts across application layers by requiring you to predict sparse-array behavior across map, for-of, keys, spread, and JSON.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Predict sparse-array behavior across map, for-of, keys, spread, and JSON.”

### E07 — Predict sort results for numbers, missing comparator, ties, mutation, and locale strings

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens collection transformations, identity, mutation, and data-shape contracts across application layers by requiring you to predict sort results for numbers, missing comparator, ties, mutation, and locale strings.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Predict sort results for numbers, missing comparator, ties, mutation, and locale strings.”

### E08 — Predict object spread with symbols, accessors, undefined, prototypes, and key collisions

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens collection transformations, identity, mutation, and data-shape contracts across application layers by requiring you to predict object spread with symbols, accessors, undefined, prototypes, and key collisions.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Trace property lookup and construction explicitly, then compare the change cost and invariant ownership of delegation, inheritance, and composition. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Predict object spread with symbols, accessors, undefined, prototypes, and key collisions.”

### E09 — Predict grouping/join output with duplicate keys, missing rows, and empty inputs

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens collection transformations, identity, mutation, and data-shape contracts across application layers by requiring you to predict grouping/join output with duplicate keys, missing rows, and empty inputs.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Predict grouping/join output with duplicate keys, missing rows, and empty inputs.”

### E10 — Predict identities after replace, insert, delete, reorder, and nested update operations

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens collection transformations, identity, mutation, and data-shape contracts across application layers by requiring you to predict identities after replace, insert, delete, reorder, and nested update operations.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Predict identities after replace, insert, delete, reorder, and nested update operations.”

## Implement

Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. In this topic, the focus is collection transformations, identity, mutation, and data-shape contracts across application layers.

### E11 — Implement stable multi-field sorting without mutating input

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens collection transformations, identity, mutation, and data-shape contracts across application layers by requiring you to implement stable multi-field sorting without mutating input.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Implement stable multi-field sorting without mutating input.”

### E12 — Implement groupBy and indexBy with explicit duplicate-key policy

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens collection transformations, identity, mutation, and data-shape contracts across application layers by requiring you to implement groupBy and indexBy with explicit duplicate-key policy.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Implement groupBy and indexBy with explicit duplicate-key policy.”

### E13 — Implement inner and left in-memory joins using indexes rather than nested search

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens collection transformations, identity, mutation, and data-shape contracts across application layers by requiring you to implement inner and left in-memory joins using indexes rather than nested search.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. Happy-path fixtures hide null, zero-child, duplicate-child, and skewed-cardinality defects; an ORM does not remove those semantics.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Implement inner and left in-memory joins using indexes rather than nested search.”

### E14 — Implement normalized ticket/comment storage and immutable denormalized selection

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens collection transformations, identity, mutation, and data-shape contracts across application layers by requiring you to implement normalized ticket/comment storage and immutable denormalized selection.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Implement normalized ticket/comment storage and immutable denormalized selection.”

### E15 — Implement a report pipeline with validation, filtering, grouping, percentile, and formatting stages

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens collection transformations, identity, mutation, and data-shape contracts across application layers by requiring you to implement a report pipeline with validation, filtering, grouping, percentile, and formatting stages.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Use bounded data, a deliberately slow consumer, error injection at each stage, and memory measurements rather than assuming piping is automatically safe. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. A stream-shaped API can still buffer the entire payload; verify bounded memory and cleanup instead of trusting the abstraction name.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Implement a report pipeline with validation, filtering, grouping, percentile, and formatting stages.”

## Test

Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. In this topic, the focus is collection transformations, identity, mutation, and data-shape contracts across application layers.

### E16 — Write tests proving inputs and unchanged nested branches retain identity

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens collection transformations, identity, mutation, and data-shape contracts across application layers by requiring you to write tests proving inputs and unchanged nested branches retain identity.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Write tests proving inputs and unchanged nested branches retain identity.”

### E17 — Create fixtures exposing duplicate keys, stable ties, missing relations, and empty groups

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens collection transformations, identity, mutation, and data-shape contracts across application layers by requiring you to create fixtures exposing duplicate keys, stable ties, missing relations, and empty groups.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Create fixtures exposing duplicate keys, stable ties, missing relations, and empty groups.”

### E18 — Compare operation counts for quadratic and indexed joins at growing sizes

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens collection transformations, identity, mutation, and data-shape contracts across application layers by requiring you to compare operation counts for quadratic and indexed joins at growing sizes.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. Happy-path fixtures hide null, zero-child, duplicate-child, and skewed-cardinality defects; an ORM does not remove those semantics.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Compare operation counts for quadratic and indexed joins at growing sizes.”

### E19 — Write property tests for normalize/denormalize round-trip under stated constraints

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens collection transformations, identity, mutation, and data-shape contracts across application layers by requiring you to write property tests for normalize/denormalize round-trip under stated constraints.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Write property tests for normalize/denormalize round-trip under stated constraints.”

### E20 — Test a report pipeline against reordered input, invalid rows, and numeric boundaries

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens collection transformations, identity, mutation, and data-shape contracts across application layers by requiring you to test a report pipeline against reordered input, invalid rows, and numeric boundaries.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. Use bounded data, a deliberately slow consumer, error injection at each stage, and memory measurements rather than assuming piping is automatically safe. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. A stream-shaped API can still buffer the entire payload; verify bounded memory and cleanup instead of trusting the abstraction name.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Test a report pipeline against reordered input, invalid rows, and numeric boundaries.”

## Debug and review

Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. In this topic, the focus is collection transformations, identity, mutation, and data-shape contracts across application layers.

### E21 — Diagnose caller-owned data mutated by sort or splice

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens collection transformations, identity, mutation, and data-shape contracts across application layers by requiring you to diagnose caller-owned data mutated by sort or splice.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Diagnose caller-owned data mutated by sort or splice.”

### E22 — Review a reduce accumulator that sometimes returns the wrong object

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens collection transformations, identity, mutation, and data-shape contracts across application layers by requiring you to review a reduce accumulator that sometimes returns the wrong object.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Review a reduce accumulator that sometimes returns the wrong object.”

### E23 — Find a duplicate-key overwrite hidden by an object lookup table

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens collection transformations, identity, mutation, and data-shape contracts across application layers by requiring you to find a duplicate-key overwrite hidden by an object lookup table.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Find a duplicate-key overwrite hidden by an object lookup table.”

### E24 — Diagnose stale denormalized data after one entity update

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens collection transformations, identity, mutation, and data-shape contracts across application layers by requiring you to diagnose stale denormalized data after one entity update.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Define freshness and ownership, force out-of-order completion or conflict, and make invalidation and rollback visible to the user. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Diagnose stale denormalized data after one entity update.”

### E25 — Review a clever chain and rewrite only if domain intent becomes clearer

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens collection transformations, identity, mutation, and data-shape contracts across application layers by requiring you to review a clever chain and rewrite only if domain intent becomes clearer.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Review a clever chain and rewrite only if domain intent becomes clearer.”

## Apply

Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. In this topic, the focus is collection transformations, identity, mutation, and data-shape contracts across application layers.

### E26 — Build RelayDesk queue transformation with explicit parse/filter/order/page stages

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens collection transformations, identity, mutation, and data-shape contracts across application layers by requiring you to build RelayDesk queue transformation with explicit parse/filter/order/page stages.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Build RelayDesk queue transformation with explicit parse/filter/order/page stages.”

### E27 — Measure and remove one repeated linear lookup in a project data path

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens collection transformations, identity, mutation, and data-shape contracts across application layers by requiring you to measure and remove one repeated linear lookup in a project data path.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Use isolated temporary data, bounded input, safe path handling, atomic writes where required, and cleanup tests for every failure stage. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Measure and remove one repeated linear lookup in a project data path.”

### E28 — Define duplicate and missing-relation policy in one response mapper

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens collection transformations, identity, mutation, and data-shape contracts across application layers by requiring you to define duplicate and missing-relation policy in one response mapper.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Define duplicate and missing-relation policy in one response mapper.”

### E29 — Audit one React state update for mutation and structural sharing

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens collection transformations, identity, mutation, and data-shape contracts across application layers by requiring you to audit one React state update for mutation and structural sharing.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Audit one React state update for mutation and structural sharing.”

### E30 — Produce a ticket activity summary with deterministic ordering and explain complexity

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens collection transformations, identity, mutation, and data-shape contracts across application layers by requiring you to produce a ticket activity summary with deterministic ordering and explain complexity.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Produce a ticket activity summary with deterministic ordering and explain complexity.”
