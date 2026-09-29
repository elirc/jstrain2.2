# Spaced-practice operating guide

The packs use a default day `0 → 1 → 3 → 7 → 14 → 21 → 30 → 45 → 60 → 90`
sequence. The numbers are target gaps, not streak deadlines. Retrieval quality
controls the next interval.

## Queue rules

1. Limit ordinary review to five items or thirty minutes per day.
2. Select one recent failure, one medium-gap item, and one older transfer first.
3. Project delivery remains the center of the course; suspend low-value cards
   rather than allowing review debt to consume build time.
4. Never do two stages for the same source on one day.
5. Change representation or context between stages.
6. Record actual elapsed days; do not reset progress because a target date was missed.

## Score-based scheduling

| Score | Meaning | Next action |
| ---: | --- | --- |
| 0 | No useful independent model | Different representation tomorrow; S2 only after cold attempt |
| 1 | Heavy hints or missing causal explanation | Repeat changed case in 1–2 days at S1 |
| 2 | Familiar case works, transfer fails | Keep interval but reduce transfer jump |
| 3 | Independent changed-context performance | Advance normally |
| 4 | Detects misuse in unfamiliar work and defends tradeoff | Advance; interleave with adjacent topic |

Accessibility aids, alternate input, narration, diagrams, and additional time
do not reduce the score. Conceptual or procedural hints do.

## Lapse repair

Do not restart a whole pack after a failure.

1. Name the missing mechanism precisely.
2. Choose a representation different from the failed attempt.
3. Study one bounded example only after a cold attempt.
4. Complete one faded example and one changed case.
5. Schedule the changed case in one day.
6. Resume the original ladder after a score of at least 3.

## Interleaving pairs

- validation ↔ authorization;
- retries ↔ idempotency;
- client cancellation ↔ server transaction completion;
- optimistic UI ↔ database optimistic concurrency;
- application guard ↔ database constraint;
- stream API ↔ actually bounded memory;
- authentication ↔ tenant/resource access;
- transaction atomicity ↔ external-effect consistency;
- line coverage ↔ discriminating assertions;
- migration success on blank data ↔ compatible production rollout.

## Weekly review budget

- **Standard course:** 3 × 20-minute queues.
- **Intensive:** 5 × 20-minute queues, never adjacent stages for the same source.
- **Sustainable:** 2 × 20-minute queues.
- **Minimum week:** 1 × 20-minute queue plus one retrieval inside project work.
- **Variable capacity:** use Red sessions for retrieval, but defer independent
  project transfer until capacity supports honest verification.

## Monthly audit

Randomly select four packs: one fundamentals, one Node/data, one UI/security,
and one process/review tool. Attempt the current stage without topic labels.
Retire a pack only after two scores of 4 at least thirty days apart and one is
based on unfamiliar project or review work.

