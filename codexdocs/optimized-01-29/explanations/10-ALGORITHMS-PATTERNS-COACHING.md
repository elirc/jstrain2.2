# 10 — Algorithms and patterns — coaching notes

Companion to [the exercise bank](../mastery/10-ALGORITHMS-PATTERNS-MASTERY.md). Read these notes after making a cold attempt, not before. Every problem includes four coaching layers without supplying a copyable finished answer.

## Explain

A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. In this topic, the focus is practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales.

### E01 — Explain preconditions/invariants for frequency map, two pointers, and sliding window

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales by requiring you to explain preconditions/invariants for frequency map, two pointers, and sliding window.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Explain preconditions/invariants for frequency map, two pointers, and sliding window.”

### E02 — Explain binary search as monotonic predicate search, not only item lookup

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales by requiring you to explain binary search as monotonic predicate search, not only item lookup.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Explain binary search as monotonic predicate search, not only item lookup.”

### E03 — Compare DFS/BFS and recursive/iterative traversal by required output/resources

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales by requiring you to compare DFS/BFS and recursive/iterative traversal by required output/resources.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Compare DFS/BFS and recursive/iterative traversal by required output/resources.”

### E04 — Explain when greedy choice needs proof and when memoization trades memory for work

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales by requiring you to explain when greedy choice needs proof and when memoization trades memory for work.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Explain when greedy choice needs proof and when memoization trades memory for work.”

### E05 — Explain time/space complexity using input size and dominant operation

- **Why it matters:** A mid-level engineer must communicate the causal model clearly enough for another person to review a decision, not merely recall syntax. It strengthens practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales by requiring you to explain time/space complexity using input size and dominant operation.
- **How to approach and prove it:** Answer from memory using mechanism → concrete example → counterexample → boundary. Then check references and correct the model in your own words. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Keep a two-minute recording or written causal diagram, plus one corrected misconception.
- **Common wrong turn:** Do not substitute terminology or a memorized rule for a causal account. If the explanation cannot predict a counterexample, the model is still too shallow. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Transfer checkpoint:** Use the model in a design or code-review conversation and answer one follow-up objection without notes. Tie the answer back to the exact behavior in “Explain time/space complexity using input size and dominant operation.”

## Predict

Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. In this topic, the focus is practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales.

### E06 — Trace two-pointer dedupe/intersection on sorted input with duplicates

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales by requiring you to trace two-pointer dedupe/intersection on sorted input with duplicates.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Trace two-pointer dedupe/intersection on sorted input with duplicates.”

### E07 — Trace fixed/variable sliding windows and identify negative-value counterexample

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales by requiring you to trace fixed/variable sliding windows and identify negative-value counterexample.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Trace fixed/variable sliding windows and identify negative-value counterexample.”

### E08 — Trace lower/upper-bound binary search across empty, missing, duplicate, and edge values

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales by requiring you to trace lower/upper-bound binary search across empty, missing, duplicate, and edge values.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Trace lower/upper-bound binary search across empty, missing, duplicate, and edge values.”

### E09 — Predict traversal order and frontier/stack size on balanced and skewed structures

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales by requiring you to predict traversal order and frontier/stack size on balanced and skewed structures.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Predict traversal order and frontier/stack size on balanced and skewed structures.”

### E10 — Predict recursive-call explosion and memoized state count for repeated subproblems

- **Why it matters:** Prediction exposes an incorrect mental model before the runtime hides it behind a plausible result. It strengthens practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales by requiring you to predict recursive-call explosion and memoized state count for repeated subproblems.
- **How to approach and prove it:** Write a trace or outcome table before execution. Run the smallest experiment, compare each mismatch, and explain the mechanism that caused the delta. Keep the pre-run prediction, observed output, and a short explanation of every mismatch.
- **Common wrong turn:** Do not run the code first and reverse-engineer a story afterward. That tests recognition, not whether your model can forecast behavior. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Name the production symptom, affected user, and diagnostic signal you would expect if this prediction were wrong in a larger system. Tie the answer back to the exact behavior in “Predict recursive-call explosion and memoized state count for repeated subproblems.”

## Implement

Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. In this topic, the focus is practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales.

### E11 — Implement count/group/top-k pipeline using frequency Map and stable tie policy

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales by requiring you to implement count/group/top-k pipeline using frequency Map and stable tie policy.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Use bounded data, a deliberately slow consumer, error injection at each stage, and memory measurements rather than assuming piping is automatically safe. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. A stream-shaped API can still buffer the entire payload; verify bounded memory and cleanup instead of trusting the abstraction name.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Implement count/group/top-k pipeline using frequency Map and stable tie policy.”

### E12 — Implement two-pointer interval merge or sorted intersection without input mutation

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales by requiring you to implement two-pointer interval merge or sorted intersection without input mutation.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Implement two-pointer interval merge or sorted intersection without input mutation.”

### E13 — Implement longest bounded window with documented monotonic assumptions

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales by requiring you to implement longest bounded window with documented monotonic assumptions.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Implement longest bounded window with documented monotonic assumptions.”

### E14 — Implement lower-bound insertion index with loop invariant comments

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales by requiring you to implement lower-bound insertion index with loop invariant comments.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. Happy-path fixtures hide null, zero-child, duplicate-child, and skewed-cardinality defects; an ORM does not remove those semantics.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Implement lower-bound insertion index with loop invariant comments.”

### E15 — Implement memoized small scheduling/count problem and bottom-up alternative

- **Why it matters:** Implementation practice converts conceptual knowledge into a bounded contract with explicit ownership and failure behavior. It strengthens practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales by requiring you to implement memoized small scheduling/count problem and bottom-up alternative.
- **How to approach and prove it:** Start with examples, invariants, and a narrow public contract. Separate pure decisions from effects, make failure explicit, and build the smallest complete version. Keep the contract, focused diff, automated tests, and one limitation you would address at the next scale threshold.
- **Common wrong turn:** Do not begin with abstractions or the happy path before fixing the contract, invariants, ownership, and failure semantics. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Identify the next consumer, the first likely requirement change, and the boundary that allows that change without a rewrite. Tie the answer back to the exact behavior in “Implement memoized small scheduling/count problem and bottom-up alternative.”

## Test

Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. In this topic, the focus is practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales.

### E16 — Property-test lower-bound partition invariant and insertion ordering

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales by requiring you to property-test lower-bound partition invariant and insertion ordering.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Property-test lower-bound partition invariant and insertion ordering.”

### E17 — Test sliding-window precondition violations and decide reject/fallback behavior

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales by requiring you to test sliding-window precondition violations and decide reject/fallback behavior.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Test sliding-window precondition violations and decide reject/fallback behavior.”

### E18 — Generate traversal cases for empty, one, cycle, deep, and wide data

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales by requiring you to generate traversal cases for empty, one, cycle, deep, and wide data.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Generate traversal cases for empty, one, cycle, deep, and wide data.”

### E19 — Compare naive and optimized algorithms against same reference outputs

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales by requiring you to compare naive and optimized algorithms against same reference outputs.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Compare naive and optimized algorithms against same reference outputs.”

### E20 — Measure growth at several sizes and relate evidence to complexity claim

- **Why it matters:** Independent evidence distinguishes working behavior from an implementation that happens to pass a happy-path demonstration. It strengthens practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales by requiring you to measure growth at several sizes and relate evidence to complexity claim.
- **How to approach and prove it:** Name the plausible defect first. Partition inputs, control nondeterminism, assert observable outcomes, and temporarily break the implementation to confirm the test discriminates. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes. Keep the named defect, red result against broken behavior, green result after repair, and why a weaker assertion would miss it.
- **Common wrong turn:** Do not mirror private calls or accept a green happy path as proof. A useful test must reject a believable incorrect implementation. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** State which higher or lower test layer would add confidence, why it is not the default here, and what production signal covers the remaining risk. Tie the answer back to the exact behavior in “Measure growth at several sizes and relate evidence to complexity claim.”

## Debug and review

Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. In this topic, the focus is practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales.

### E21 — Diagnose binary-search bounds that stall or skip final candidate

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales by requiring you to diagnose binary-search bounds that stall or skip final candidate.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Diagnose binary-search bounds that stall or skip final candidate.”

### E22 — Review sliding window applied where removing items does not restore validity monotonically

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales by requiring you to review sliding window applied where removing items does not restore validity monotonically.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Review sliding window applied where removing items does not restore validity monotonically.”

### E23 — Find input mutation introduced by convenient sort before an algorithm

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales by requiring you to find input mutation introduced by convenient sort before an algorithm.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Find input mutation introduced by convenient sort before an algorithm.”

### E24 — Diagnose memoization collision/incomplete state key

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales by requiring you to diagnose memoization collision/incomplete state key.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Diagnose memoization collision/incomplete state key.”

### E25 — Reject an asymptotically clever solution whose complexity/maintenance cost is unnecessary

- **Why it matters:** Diagnosis and review build the judgment needed to enter unfamiliar code, rank risks, and repair causes without broad accidental change. It strengthens practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales by requiring you to reject an asymptotically clever solution whose complexity/maintenance cost is unnecessary.
- **How to approach and prove it:** Reproduce reliably, reduce the search space, rank hypotheses, and collect evidence that can falsify each one. Add a regression test before the smallest causal fix. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes. Keep the reproduction, hypothesis log, decisive evidence, minimal fix, and regression result.
- **Common wrong turn:** Do not change several variables at once or collect unstructured logs without a falsifiable hypothesis; both destroy causal evidence. Swallowing, stringifying, or repeatedly translating an error often loses cause and recovery meaning while making logs noisier.
- **Transfer checkpoint:** Translate the root cause into prevention: an earlier validation, clearer ownership rule, safer API, test, metric, or runbook step. Tie the answer back to the exact behavior in “Reject an asymptotically clever solution whose complexity/maintenance cost is unnecessary.”

## Apply

Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. In this topic, the focus is practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales.

### E26 — Use frequency/index patterns for one RelayDesk report and explain tie semantics

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales by requiring you to use frequency/index patterns for one RelayDesk report and explain tie semantics.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. Happy-path fixtures hide null, zero-child, duplicate-child, and skewed-cardinality defects; an ORM does not remove those semantics.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Use frequency/index patterns for one RelayDesk report and explain tie semantics.”

### E27 — Implement keyset/query boundary search or client insertion with invariant tests

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales by requiring you to implement keyset/query boundary search or client insertion with invariant tests.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. Happy-path fixtures hide null, zero-child, duplicate-child, and skewed-cardinality defects; an ORM does not remove those semantics.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Implement keyset/query boundary search or client insertion with invariant tests.”

### E28 — Measure one slow transformation before selecting an algorithmic change

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales by requiring you to measure one slow transformation before selecting an algorithmic change.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Measure one slow transformation before selecting an algorithmic change.”

### E29 — Replace recursion for hostile-depth input where stack safety matters

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales by requiring you to replace recursion for hostile-depth input where stack safety matters.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Replace recursion for hostile-depth input where stack safety matters.”

### E30 — Present one optimization PR with baseline, invariant, correctness proof, and tradeoff

- **Why it matters:** Project transfer proves the skill survives realistic state, users, dependencies, and operational constraints. It strengthens practical algorithm recognition, complexity, boundary cases, and communicating why a solution scales by requiring you to present one optimization PR with baseline, invariant, correctness proof, and tradeoff.
- **How to approach and prove it:** Deliver a thin vertical slice with acceptance criteria, authorization, errors, tests, logs, and rollback implications. Record one rejected alternative and its tradeoff. Keep the ticket, reviewable diff, verification output, operational evidence, and spoken technical defense.
- **Common wrong turn:** Do not build isolated horizontal layers and call them integration. The result must cross real boundaries and remain diagnosable when one boundary fails. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Transfer checkpoint:** Rehearse one follow-up change and one dependency failure; explain how the design contains their blast radius and how an operator recovers. Tie the answer back to the exact behavior in “Present one optimization PR with baseline, invariant, correctness proof, and tradeoff.”
