# Mid-level engineering assessment

This assessment measures evidence, not confidence. The candidate receives one unfamiliar bounded change and one injected defect.

## Part A: architecture explanation — 20 points

Without notes, trace one real request from React through HTTP, validation, identity, resource authorization, transaction, audit/job, response, and user-visible state.

| Score | Evidence |
| ---: | --- |
| 0-5 | names technologies but not ownership boundaries |
| 6-10 | traces happy path with minor prompting |
| 11-15 | includes failure, retry, and concurrency behavior |
| 16-20 | compares alternatives and names current scale/operational threshold |

## Part B: bounded feature — 30 points

Choose one lab. Required artifacts:

- framed outcome, non-goals, invariants, threat cases;
- migration/contract/API/domain-or-repository/React slice where relevant;
- first critical test and widening verification;
- ADR or change note for one meaningful tradeoff;
- accurate README/progress update.

Scoring: decomposition 5, correctness 8, authorization/data safety 5, tests 5, UI/API usability 3, operations/docs 4.

## Part C: unfamiliar debugging — 25 points

The mentor injects one defect without naming its location. Candidate must:

1. reproduce from a symptom;
2. gather evidence before editing;
3. narrow layer and hypothesis;
4. write or identify a regression test;
5. make the smallest correct fix;
6. run widening checks;
7. explain why nearby behavior is unaffected.

Points are lost for speculative rewrites, disabling tests, increasing sleeps, or hiding errors.

## Part D: code review — 15 points

Review a plausible patch containing at least three of:

- unchecked input assertion;
- missing tenant predicate;
- check outside transaction;
- last-write-wins update;
- in-memory idempotency;
- retry without cap;
- inaccessible interaction;
- log containing a token/private body.

For each issue, cite code, describe a concrete failure, rank severity, and propose a test oracle. Preferences must be separated from correctness defects.

## Part E: operations — 10 points

Build and start API/worker, interpret readiness, initiate graceful shutdown, explain backup/restore and rollback boundary, and find one failed/dead job from stored evidence.

## Passing rule

- 70/100 overall;
- at least half credit in every part;
- no unresolved critical tenant, data-loss, or oversell/double-book defect;
- candidate can explain their implementation without AI-generated wording.

## Oral defense prompts

- What is the most dangerous invariant in this project?
- Which check is duplicated at two layers, and why?
- What exact retry ambiguity exists?
- What can TypeScript not prove here?
- Why is the race test deterministic?
- What changes first at multi-host scale?
- Name one design you rejected and the failure mode that drove the choice.
