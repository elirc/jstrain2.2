# Challenge and debug-first mode

Use this mode when broken behavior, incidents, puzzles, or adversarial review
creates engagement. It develops useful judgment only when diagnosis stays
evidence-driven and transfers into ordinary product work.

## Challenge ladder

1. **Output prediction:** commit to result and mechanism.
2. **Single defect:** reproduce, narrow, test, repair.
3. **Competing hypotheses:** choose the cheapest discriminating evidence.
4. **Cross-layer defect:** trace UI, API, domain, data, and operations.
5. **Incident:** diagnose under incomplete evidence and recover safely.
6. **Change challenge:** add a requirement without violating old contracts.

## Sixty-minute session

1. Read only symptom and constraints — 5 minutes.
2. Reproduce and record exact observation — 10 minutes.
3. Rank at least three hypotheses — 5 minutes.
4. Narrow with tests/instrumentation — 15 minutes.
5. Add regression and minimal repair — 15 minutes.
6. Explain root cause and prevention — 10 minutes.

Use a hypothesis log:

| Hypothesis | Evidence expected | Cheapest check | Result | Status |
| --- | --- | --- | --- | --- |
| | | | | |

## Adapt a mastery exercise

- Explain: begin with a false explanation and find the counterexample.
- Predict: use a snippet containing one plausible misleading detail.
- Implement: receive tests plus a broken partial implementation.
- Test: receive several implementations and write tests that distinguish them.
- Debug/review: use unchanged, but enforce the hypothesis log.
- Apply: inject a failure into RelayDesk or a CRUD project and recover it.

## Adapt a project increment

After the normal acceptance path, choose one fault: duplicate command, stale
version, dependency timeout, worker crash, migration interruption, malformed
response, role revocation, or client disconnect. Observe the current behavior
before designing protection. Add logs/metrics only when they answer a diagnostic
question.

## AI role

Ask AI to act as challenge author and withhold the root cause. It may reveal
evidence only when you request a specific observation. Later ask it to review
whether your regression test catches symptom or cause and to propose a competing
root cause.

## Failure signals and correction

- **Guess-and-edit loop:** require three ranked hypotheses before changes.
- **Debugger wandering:** state what the next breakpoint/log discriminates.
- **Clever puzzle obsession:** transfer each mechanism into a project ticket.
- **Broad cleanup in the fix:** separate causal repair from optional refactor.
- **Regression passes before fix:** prove it fails against the original defect.

## Exit evidence

Keep the reproduction, hypothesis log, decisive observation, red/green
regression, minimal diff, root-cause explanation, and one prevention improvement.

<!-- spaced-pack-link:start -->
## Spaced practice

Use the [ten-stage day 0–90 practice pack](spaced-packs/06-CHALLENGE-DEBUG-FIRST-SPACED-PACK.md) to retrieve, vary, and transfer this material instead of rereading it.
<!-- spaced-pack-link:end -->
