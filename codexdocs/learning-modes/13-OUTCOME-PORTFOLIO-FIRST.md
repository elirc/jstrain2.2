# Outcome and portfolio-first mode

Use this mode when a visible professional outcome sustains motivation better
than a syllabus. Begin from the demonstration and evidence a reviewer should
see, then work backward to the smallest credible implementation and prerequisite
practice.

## Reverse-planning method

### 1. Define the claim

Write one narrow professional claim, such as:

> I can prevent duplicate order fulfillment across retries and worker crashes.

Avoid “I know Node” or “I built a full-stack app.”

### 2. Define skeptical-review evidence

Specify:

- running user or operator behavior;
- automated test rejecting a plausible wrong design;
- architecture/sequence explanation;
- failure injection and recovery;
- tradeoff and limitation;
- reviewable commit history.

### 3. Derive the feature slice

Choose the smallest project behavior capable of producing all evidence. Remove
features that do not support the claim.

### 4. Route prerequisites just in time

Use the optimized 01–29 track and mastery banks only for skills blocking the
slice. Return to the project as soon as one changed-example exercise succeeds.

### 5. Publish and defend

Write the README section, capture the demo, and answer reviewer objections.
State scale assumptions honestly.

## Ninety-minute session

1. Claim and skeptical evidence — 10 minutes.
2. Current gap and routed prerequisite — 15 minutes.
3. Project implementation — 40 minutes.
4. Adversarial test/review — 15 minutes.
5. Portfolio narrative and next gap — 10 minutes.

## Adapt a mastery exercise

Attach each exercise to a project claim. If the task cannot improve code,
evidence, explanation, or a likely interview/debug scenario, defer it. Complete
the Apply rung first as a diagnostic, route backward to the failed rung, then
return to Apply after feedback.

## Adapt a project increment

Write the final demo before implementation:

```text
User action:
Dangerous competing/failure action:
Visible honest outcome:
Test evidence:
Operator evidence:
Tradeoff I will explain:
```

Implement only what makes that demonstration real. Add ordinary usability after
the central claim is proven, not instead of it.

## AI role

Ask AI to act as a skeptical hiring-manager or senior-reviewer: challenge vague
claims, request evidence, identify overstatement, and mutate constraints. Do not
let it write the portfolio narrative before the implementation evidence exists.

## Failure signals and correction

- **README-driven exaggeration:** link every claim to executable evidence.
- **Demo-only implementation:** add clean setup, tests, errors, and operations.
- **Skipping foundations indefinitely:** route repeated failures into targeted practice.
- **Polish displaces risk:** prioritize authorization, data, concurrency, and recovery.
- **Only impressive features remain:** include maintainability and change evidence.

## Exit evidence

Keep claim, reverse plan, prerequisite route, working slice, adversarial proof,
review response, demo, and honest limitations section.

<!-- spaced-pack-link:start -->
## Spaced practice

Use the [ten-stage day 0–90 practice pack](spaced-packs/13-OUTCOME-PORTFOLIO-FIRST-SPACED-PACK.md) to retrieve, vary, and transfer this material instead of rereading it.
<!-- spaced-pack-link:end -->
