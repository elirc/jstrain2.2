# Whole-course spaced-repetition operating guide

This library is intentionally much larger than one learner's active queue. It
provides a ten-stage path for every course file so you can select the material
that current project evidence says you need.

## Do not activate everything

At the start of a project increment, activate at most:

- one underlying JavaScript/TypeScript topic;
- one framework, Node, HTTP, or SQL topic;
- one test/debug/security topic;
- one process or learning-mode guide;
- one project requirement or architecture document.

Archive a pack when it no longer addresses the current capability risk. The
generated index is a library, not a 9,700-item daily backlog.

## Default gaps

Use days `0, 1, 3, 7, 14, 21, 30, 45, 60, 90`. Measure from the actual last
attempt. A missed date extends the gap; it does not erase earlier evidence.

## Daily queue

Cap review at five actions or thirty minutes:

1. One score-0/1 lapse repair.
2. One recent reconstruction.
3. One seven-to-21-day discrimination task.
4. One 30-to-90-day project/review transfer.
5. Optional verbal defense or incident task.

Complete retrieval before project work only when the item is short. Put
project-transfer stages inside the related ticket rather than duplicating work.

## Score and interval

| Score | Evidence | Scheduling action |
| ---: | --- | --- |
| 0 | No independent model | Different representation tomorrow; S2 after attempting |
| 1 | Heavy conceptual/procedural help | Changed case in 1–2 days at S1 |
| 2 | Familiar success, failed transfer | Short gap and smaller transfer step |
| 3 | Independent changed-context result | Advance normally |
| 4 | Unfamiliar review/project use and defense | Advance, interleave, consider retirement |

Accessibility support does not lower a score. Assistance that supplies the
decision or mechanism does.

## Lapse repair

1. Identify the smallest missing model.
2. Change representation: code ↔ diagram ↔ narration ↔ example ↔ test.
3. Make a cold attempt.
4. Inspect one bounded source section or example.
5. Complete a faded task and a changed case.
6. Resume the original stage after scoring at least 3.

Do not restart ten stages because one old item failed.

## Interleave by decisions

Useful pairs include:

- validation and authorization;
- retry and idempotency;
- optimistic UI and database concurrency;
- streams and bounded memory;
- transactions and external side effects;
- application guards and database constraints;
- code coverage and discriminating tests;
- current schema success and mixed-version migration safety;
- authentication and tenant/resource access;
- client cancellation and server-side completion.

Hide source titles during interleaving. First decide which mechanism applies.

## Weekly and monthly maintenance

Weekly:

- remove packs that no longer map to the next project risk;
- reschedule lapses based on evidence rather than guilt;
- verify at least one item through real project work;
- fade one scaffold;
- preserve the 70% project / 20% targeted practice / 10% review balance.

Monthly, sample eight active or recently retired packs across fundamentals,
Node/API, React, data, testing/debugging, security, operations, and project
requirements. Retire a pack after two score-4 results at least thirty days apart,
including one unfamiliar code review, change, or incident.

