# Pattern and analogy-first mode

Use this mode when you learn by comparing cases and extracting a reusable
structure. It is valuable for design patterns, state machines, validation,
repositories, async control, React state, test selection, and debugging.
Analogies are hypotheses; their breaking points matter as much as similarities.

## Compare–contrast loop

1. Select two examples that share a mechanism but differ in domain.
2. List structural similarities without using domain nouns.
3. List material differences in ownership, time, failure, scale, or trust.
4. Propose the reusable pattern and its preconditions.
5. Find a counterexample where the pattern becomes harmful.
6. Apply it to a third problem and measure whether it clarifies the design.

Use a pattern card:

```text
Recurring pressure:
Invariant:
Shape of solution:
Preconditions:
Costs introduced:
Misleading look-alike:
Exit/simplification condition:
```

## Sixty-minute session

1. Compare two cases — 10 minutes.
2. Extract a pattern card — 10 minutes.
3. Analyze a misleading look-alike — 10 minutes.
4. Implement the third case — 20 minutes.
5. Explain where analogy breaks — 5 minutes.
6. Queue an interleaved retrieval — 5 minutes.

## Adapt a mastery exercise

- Functions/closures: compare cache, event listener, and factory closure lifetimes.
- Async: compare retry, polling, queue consumption, and user-action cancellation.
- Patterns: compare two genuine uses and one ceremony-only use.
- SQL: compare a collection transformation with relational set/cardinality behavior.
- Testing: compare tests that look alike but protect different boundaries.
- Security: compare the same untrusted string entering SQL, shell, HTML, and logs.

The result must include a breaking point, not just a mnemonic.

## Adapt a project increment

Compare the new workflow with an existing one. Reuse domain-neutral
infrastructure only when lifecycle and failure semantics match. A purchase
order and sales order both contain lines, but receiving and inventory
reservation have different invariants; shared code must not erase them.

## AI role

Ask AI for a counterexample, misleading analogy, or domain where the proposed
pattern fails. Let it critique your preconditions. Do not ask it to name a
design pattern first; premature labels often cause solution-first reasoning.

## Failure signals and correction

- **Surface resemblance drives reuse:** compare invariants and failure semantics.
- **Everything becomes one favored pattern:** require two rejected alternatives.
- **Analogy replaces runtime evidence:** implement and test the third case.
- **Pattern vocabulary masks complexity:** explain without the pattern's name.
- **Difference list keeps growing:** treat the cases separately.

## Exit evidence

Keep comparison table, pattern card, misleading look-alike, third-case
implementation, tests, and explanation of the exact analogy boundary.

<!-- spaced-pack-link:start -->
## Spaced practice

Use the [ten-stage day 0–90 practice pack](spaced-packs/11-PATTERN-ANALOGY-FIRST-SPACED-PACK.md) to retrieve, vary, and transfer this material instead of rereading it.
<!-- spaced-pack-link:end -->
