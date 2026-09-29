# Reusable session cards

Copy one card into the learning log. A session is sized by its artifact, not by
how much material you consume.

## 15-minute restart card

Use after interruption or on a low-capacity day.

```text
Minute 0–2: read outcome and last verified fact
Minute 2–5: reproduce the last command/test
Minute 5–11: complete one physical action
Minute 11–13: verify and record result
Minute 13–15: write exact next action and stop condition

Artifact:
Next command:
Risk not addressed:
```

## 25-minute focused card

```text
Outcome:
Cold prediction (3 min):
One action (15 min):
Verification (4 min):
Correction/next step (3 min):
Mode:
Support level:
```

Good outcomes: one domain rule, failing regression, query fixture, state diagram,
accessible component state, API error case, or clarified ticket.

## 45-minute mastery card

```text
5 min  — attempt before notes
10 min — inspect example/reference/coaching feedback
15 min — solve or implement independently
10 min — changed-constraint transfer
5 min  — explain and schedule delayed retrieval
```

Require one misconception and one counterexample in the log.

## 60-minute debug card

```text
Symptom:
Exact reproduction:
Three ranked hypotheses:
Evidence that distinguishes them:
Regression test:
Smallest causal fix:
Prevention/monitoring:
```

Time allocation: reproduce 10, hypothesize 5, narrow 15, regress/fix 20,
explain 10. Stop before fixing if reproduction is not trustworthy.

## 90-minute vertical-slice card

```text
User outcome and non-goals:
Domain invariant:
Authorization decision:
Wire/data contract:
Riskiest failure:

10 min — acceptance and model
15 min — failing domain/integration evidence
40 min — smallest UI→API→domain→data implementation
15 min — failure/conflict/accessibility checks
10 min — review, explain, restart note
```

If 90 minutes cannot produce a runnable slice, shrink the behavior rather than
leaving five partially complete layers.

## Two-hour example-to-transfer lab

```text
15 min — cold problem
20 min — annotate worked example decisions
20 min — faded completion
30 min — independent near-transfer
20 min — project transfer
10 min — adversarial review
5 min  — delayed retrieval plan
```

Use only for a genuinely unfamiliar high-interactivity mechanism. Move to
prompted or independent work after success.

## Half-day release card

1. Confirm acceptance, non-goals, and rollback.
2. Finish one reviewable vertical change.
3. Run narrow then package/integration/build verification.
4. Review authorization, errors, data, concurrency, accessibility, and logs.
5. Deploy or simulate release from clean state.
6. Run smoke test and inspect operational evidence.
7. Demo, update documentation, and write retro.

Take breaks between blocks. A half-day is not permission for a giant diff.

## Mode overlays

- **Build-first:** shorten planning, but keep prediction and failure checks.
- **Example-first:** replace initial implementation time with annotation/fading.
- **Visual:** create the model before the test and update it from evidence.
- **Verbal:** narrate at start, after correction, and during final defense.
- **Challenge:** begin from a symptom and conceal the intended mechanism.
- **Structured:** expose only the current block and next physical action.
- **Collaborative:** split independent plans, driver/navigator, and silent review.
- **Adaptive:** select the card below current maximum capacity and preserve restart notes.
- **Reading:** allocate no more than one-third to open-source reading.
- **Pattern:** compare two cases before implementing the third.
- **Simulation:** add a stakeholder change or operational failure after first success.
- **Outcome-first:** write final portfolio claim and skeptical evidence first.

<!-- spaced-pack-link:start -->
## Spaced practice

Use the [ten-stage day 0–90 practice pack](spaced-packs/SESSION-CARDS-SPACED-PACK.md) to retrieve, vary, and transfer this material instead of rereading it.
<!-- spaced-pack-link:end -->
