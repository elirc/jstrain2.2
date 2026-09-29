# Example-first mode

Use this mode when unfamiliar syntax and system structure consume so much
working memory that you cannot identify the important decisions. Examples are
temporary scaffolds; the mode succeeds only when support fades.

## The four-pass example method

### Pass 1 — predict

Hide the result. Predict the purpose, output, mutation, failure, and cleanup.
Mark every line you cannot justify.

### Pass 2 — annotate decisions

For each meaningful block, record:

```text
Constraint:
Decision:
Alternative rejected:
Failure prevented:
Evidence:
```

Do not paraphrase syntax. Explain why this boundary or representation exists.

### Pass 3 — fade

Remove one-third of the implementation: validation, a domain branch, query,
async cleanup, or test assertions. Reconstruct it from the contract. Then remove
two-thirds. Finally start from only acceptance cases.

### Pass 4 — vary

Change a constraint: multiple tenants, concurrent calls, cancellation, a stale
version, a larger input, or a failing dependency. Adapt without copying the
original structure blindly.

## Sixty-minute session

1. Cold prediction — 10 minutes.
2. Study and annotate one worked example — 15 minutes.
3. Complete a faded example — 15 minutes.
4. Solve a near-transfer problem — 15 minutes.
5. Schedule a blank-file attempt — 5 minutes.

## Adapt a mastery exercise

Use the relevant [coaching note](../optimized-01-29/explanations/README.md) only
after a cold plan. Find or write one small worked example. Produce a second
example with one material decision changed. Finish the original exercise at
support level S1 or S0.

## Adapt a project increment

Study one complete small slice from RelayDesk or the selected project. Label
route, validation, command, transaction, repository, response, UI state, and
test. Rebuild an analogous slice for a different resource without sharing
business logic merely to make the files resemble each other.

## AI role

Ask AI to provide a **minimal annotated example**, then request a faded version
with deliberate blanks. Ask it to generate a subtly wrong alternative for you
to review. Never accept “here is the complete application” as an example.

## Failure signals and correction

- **Copying with identifier changes:** close the example and rebuild from acceptance cases.
- **Remembering shape but not decisions:** annotate alternatives and failure prevention.
- **Example dependency after two successes:** drop immediately to S1/S0 support.
- **Example no longer matches the problem:** use the contract, not surface resemblance.
- **Overload remains:** reduce to one mechanism and switch to Structured guided.

## Exit evidence

Keep the annotated example, faded reconstruction, changed-constraint solution,
and delayed independent solution. Explain which original design choice did not
transfer and why.

<!-- spaced-pack-link:start -->
## Spaced practice

Use the [ten-stage day 0–90 practice pack](spaced-packs/03-EXAMPLE-FIRST-SPACED-PACK.md) to retrieve, vary, and transfer this material instead of rereading it.
<!-- spaced-pack-link:end -->
