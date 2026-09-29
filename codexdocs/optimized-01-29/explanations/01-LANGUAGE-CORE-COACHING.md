# 01 — Language core — coaching notes

Companion to [the exercise bank](../mastery/01-LANGUAGE-CORE-MASTERY.md). Read these notes after making a cold attempt, not before. Every problem includes four coaching layers without supplying a copyable finished answer.

## Explain

A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. In this topic, the focus is runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent.

### E01 — Explain binding, value, object identity, mutation, and rebinding with one diagram

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent by requiring you to explain binding, value, object identity, mutation, and rebinding with one diagram.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Explain binding, value, object identity, mutation, and rebinding with one diagram.”

### E02 — Contrast ||, ??, default parameters, and destructuring defaults for five absent/falsy inputs

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent by requiring you to contrast `||`, `??`, default parameters, and destructuring defaults for five absent/falsy inputs.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Contrast ||, ??, default parameters, and destructuring defaults for five absent/falsy inputs.”

### E03 — Explain ===, Object.is, and deep equality, including NaN, signed zero, and objects

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent by requiring you to explain `===`, `Object.is`, and deep equality, including `NaN`, signed zero, and objects.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Explain ===, Object.is, and deep equality, including NaN, signed zero, and objects.”

### E04 — Explain why TypeScript types disappear and list five runtime trust boundaries

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent by requiring you to explain why TypeScript types disappear and list five runtime trust boundaries.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Explain why TypeScript types disappear and list five runtime trust boundaries.”

### E05 — Explain floating-point representation and choose a money strategy with tradeoffs

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent by requiring you to explain floating-point representation and choose a money strategy with tradeoffs.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. Binary floating-point and recalculation from current values make historical totals irreproducible and can violate refund or allocation bounds.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Explain floating-point representation and choose a money strategy with tradeoffs.”

## Predict

Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. In this topic, the focus is runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent.

### E06 — Predict 20 coercions across Boolean, Number, String, equality, and JSON before running them

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent by requiring you to predict 20 coercions across Boolean, Number, String, equality, and JSON before running them.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Predict 20 coercions across Boolean, Number, String, equality, and JSON before running them.”

### E07 — Predict identities after assignment, spread, nested spread, array map, and structured clone

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent by requiring you to predict identities after assignment, spread, nested spread, array map, and structured clone.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Predict identities after assignment, spread, nested spread, array map, and structured clone.”

### E08 — Predict destructuring results for missing, undefined, null, zero, and empty-string fields

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent by requiring you to predict destructuring results for missing, undefined, null, zero, and empty-string fields.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Predict destructuring results for missing, undefined, null, zero, and empty-string fields.”

### E09 — Predict parsing for strict integer candidates including whitespace, prefixes, exponent, and unsafe range

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent by requiring you to predict parsing for strict integer candidates including whitespace, prefixes, exponent, and unsafe range.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Predict parsing for strict integer candidates including whitespace, prefixes, exponent, and unsafe range.”

### E10 — Predict date results for invalid days, offsets, local text, DST boundaries, and invalid strings

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent by requiring you to predict date results for invalid days, offsets, local text, DST boundaries, and invalid strings.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Predict date results for invalid days, offsets, local text, DST boundaries, and invalid strings.”

## Implement

Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. In this topic, the focus is runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent.

### E11 — Implement strict finite integer parsing with min/max and structured errors

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent by requiring you to implement strict finite integer parsing with min/max and structured errors.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. Swallowing, stringifying, or repeatedly translating an error often loses cause and recovery meaning while making logs noisier.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Implement strict finite integer parsing with min/max and structured errors.”

### E12 — Implement a presence-aware patch mapper that distinguishes missing, null, empty, false, and zero

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent by requiring you to implement a presence-aware patch mapper that distinguishes missing, null, empty, false, and zero.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Implement a presence-aware patch mapper that distinguishes missing, null, empty, false, and zero.”

### E13 — Implement an immutable nested update that clones only the changed spine

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent by requiring you to implement an immutable nested update that clones only the changed spine.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Implement an immutable nested update that clones only the changed spine.”

### E14 — Implement currency addition/formatting using integer minor units and explicit rounding input

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent by requiring you to implement currency addition/formatting using integer minor units and explicit rounding input.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. Binary floating-point and recalculation from current values make historical totals irreproducible and can violate refund or allocation bounds.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Implement currency addition/formatting using integer minor units and explicit rounding input.”

### E15 — Implement strict UTC timestamp validation with canonical output and calendar validity

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent by requiring you to implement strict UTC timestamp validation with canonical output and calendar validity.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Implement strict UTC timestamp validation with canonical output and calendar validity.”

## Test

Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. In this topic, the focus is runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent.

### E16 — Create a boundary table that would fail under truthiness-based defaulting

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent by requiring you to create a boundary table that would fail under truthiness-based defaulting.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Create a boundary table that would fail under truthiness-based defaulting.”

### E17 — Write identity assertions that catch shallow-copy mutation of nested ticket state

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent by requiring you to write identity assertions that catch shallow-copy mutation of nested ticket state.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Write identity assertions that catch shallow-copy mutation of nested ticket state.”

### E18 — Build property tests for integer parser acceptance/rejection symmetry

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent by requiring you to build property tests for integer parser acceptance/rejection symmetry.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Build property tests for integer parser acceptance/rejection symmetry.”

### E19 — Test JSON round trips for undefined, bigint, date, NaN, infinity, and custom objects

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent by requiring you to test JSON round trips for undefined, bigint, date, NaN, infinity, and custom objects.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Test JSON round trips for undefined, bigint, date, NaN, infinity, and custom objects.”

### E20 — Write the test that distinguishes Date parseability from the required timestamp grammar

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent by requiring you to write the test that distinguishes Date parseability from the required timestamp grammar.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Write the test that distinguishes Date parseability from the required timestamp grammar.”

## Debug and review

Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. In this topic, the focus is runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent.

### E21 — Diagnose a zero-value overwritten by || without editing before reproduction

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent by requiring you to diagnose a zero-value overwritten by `||` without editing before reproduction.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Diagnose a zero-value overwritten by || without editing before reproduction.”

### E22 — Review a spread-based clone and identify every shared nested identity

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent by requiring you to review a spread-based clone and identify every shared nested identity.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Review a spread-based clone and identify every shared nested identity.”

### E23 — Find a permissive numeric parser accepting trailing junk and propose minimal correction

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent by requiring you to find a permissive numeric parser accepting trailing junk and propose minimal correction.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Find a permissive numeric parser accepting trailing junk and propose minimal correction.”

### E24 — Diagnose a money-total drift and separate representation from formatting defects

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent by requiring you to diagnose a money-total drift and separate representation from formatting defects.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. Binary floating-point and recalculation from current values make historical totals irreproducible and can violate refund or allocation bounds.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Diagnose a money-total drift and separate representation from formatting defects.”

### E25 — Review a boundary cast and specify runtime evidence the assertion falsely claims

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent by requiring you to review a boundary cast and specify runtime evidence the assertion falsely claims.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Review a boundary cast and specify runtime evidence the assertion falsely claims.”

## Apply

Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. In this topic, the focus is runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent.

### E26 — Audit RelayDesk configuration parsing for coercion and missing-versus-falsy mistakes

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent by requiring you to audit RelayDesk configuration parsing for coercion and missing-versus-falsy mistakes.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Audit RelayDesk configuration parsing for coercion and missing-versus-falsy mistakes.”

### E27 — Replace one unsafe request assertion with explicit parsing and useful field diagnostics

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent by requiring you to replace one unsafe request assertion with explicit parsing and useful field diagnostics.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Replace one unsafe request assertion with explicit parsing and useful field diagnostics.”

### E28 — Trace object ownership through one React update and document preserved identities

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent by requiring you to trace object ownership through one React update and document preserved identities.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Trace object ownership through one React update and document preserved identities.”

### E29 — Establish canonical timestamp rules across API, database, and UI with tests

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent by requiring you to establish canonical timestamp rules across API, database, and UI with tests.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. Happy-path fixtures hide null, zero-child, duplicate-child, and skewed-cardinality defects; an ORM does not remove those semantics.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Establish canonical timestamp rules across API, database, and UI with tests.”

### E30 — Review one production-shaped diff for runtime assumptions invisible to TypeScript

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens runtime semantics and boundary contracts, where confident guessing often creates defects that types cannot prevent by requiring you to review one production-shaped diff for runtime assumptions invisible to TypeScript.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Review one production-shaped diff for runtime assumptions invisible to TypeScript.”
