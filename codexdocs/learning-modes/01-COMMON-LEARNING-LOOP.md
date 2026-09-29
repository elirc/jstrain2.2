# Common learning loop

All modes use this loop. Session format may vary, but none may remove retrieval,
feedback, explanation, transfer, or spacing.

## The AIFTR loop

### 1. Attempt

Before notes or AI, spend 5–20 minutes producing something: a prediction,
contract, diagram, test list, implementation, diagnosis, or review. Mark guesses.
This baseline makes the knowledge gap visible.

### 2. Inspect

Compare the attempt with runtime behavior, tests, a worked example, coaching
notes, documentation, or review. Write the smallest meaningful difference:

```text
I predicted:
I observed:
The mechanism I was missing:
The next case that could disprove my new model:
```

### 3. Fix and explain

Correct the artifact, then explain mechanism → example → counterexample →
boundary. Avoid “it works because the framework handles it.” Name who owns the
state, validation, failure, cleanup, retry, or authorization decision.

### 4. Transfer

Change one dimension:

- new input boundary;
- asynchronous rather than synchronous execution;
- repeated or concurrent delivery;
- different user or tenant;
- persistence or network failure;
- larger data size;
- changed requirement or older version.

A solution that works only with the original cues is not yet transferable.

### 5. Retrieve later

Reattempt without notes after roughly one day, three days, one week, and three
weeks. Use the schedule as a starting point, not a law: increase the interval
after clean recall and shorten it after a conceptual failure.

## Session evidence

Every session leaves one row:

| Attempt | Feedback source | Correction | Transfer | Next retrieval |
| --- | --- | --- | --- | --- |
| Link or summary | Test/docs/review | Missing mechanism | Changed dimension | Date |

The artifact may be code, tests, a diagram, or a recording. It must be
inspectable and tied to an engineering outcome.

## Difficulty control

Change only one or two dimensions at a time:

- **Knowledge:** familiar mechanism → combined mechanisms → unfamiliar system.
- **Support:** complete example → faded example → prompts → independent ticket.
- **Scope:** pure function → module → boundary → vertical slice → incident.
- **Time:** unlimited → timebox → interruption/recovery → live explanation.
- **Reliability:** success → validation failure → dependency failure → race/crash.

If success is automatic, remove support or add transfer. If no useful attempt is
possible, reduce scope or provide a worked example; do not repeatedly rehearse
confusion.

## AI roles by phase

- **Attempt:** AI may clarify wording but should not propose the solution.
- **Inspect:** AI may compare artifacts, ask questions, and identify missing cases.
- **Fix:** AI may suggest options; you choose and explain the final change.
- **Transfer:** AI should mutate constraints or inject a plausible failure.
- **Retrieve:** AI acts as interviewer or test runner, not answer source.

Always request counterexamples and verification, not confidence. Record an AI
suggestion you rejected or corrected whenever it exposes a judgment call.

## Mastery signal

Mark a skill ready for project use when you can:

- produce the core behavior without procedural hints;
- predict at least two failure paths;
- write a discriminating test;
- explain one tradeoff and rejected alternative;
- transfer it to a changed example after a delay.

Mark it mid-level evidence only after using it inside a reviewable project
change with authorization, operations, and compatibility considered where
relevant.

<!-- spaced-pack-link:start -->
## Spaced practice

Use the [ten-stage day 0–90 practice pack](spaced-packs/01-COMMON-LEARNING-LOOP-SPACED-PACK.md) to retrieve, vary, and transfer this material instead of rereading it.
<!-- spaced-pack-link:end -->
