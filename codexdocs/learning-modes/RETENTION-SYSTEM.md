# Retention and transfer system

This system prevents a large course from becoming a one-pass reading project.
It schedules retrieval of decisions and mechanisms, not trivia-sized syntax.

## Retrieval unit

Create one card only for knowledge worth using again:

```text
Trigger/problem:
Decision or mechanism to retrieve:
One boundary/counterexample:
One project location:
Last result: clean | minor lookup | concept failure
Next date:
```

Good cards ask you to predict, implement, diagnose, compare, or explain. Weak
cards ask for isolated terminology without application.

## Default interval ladder

| Interval | Task |
| --- | --- |
| End of session | Restate correction without notes |
| 1 day | Reproduce core mechanism from a blank artifact |
| 3 days | Solve a near-transfer problem with one changed constraint |
| 7 days | Solve an interleaved problem without its topic label |
| 21 days | Apply in a project, review, or incident |
| 45 days | Explain and modify unfamiliar code using the mechanism |

Use this as a starting schedule. A concept failure returns to one day with a
different representation. A minor syntax lookup keeps the interval when the
model, design, and failure reasoning were correct.

## Daily queue

Limit retrieval to 15–30 minutes and at most five items:

1. One recently failed concept.
2. One three-to-seven-day transfer.
3. One older interleaved/project item.
4. Optional verbal explanation.
5. Optional debug/review item.

Do not allow the queue to consume the project. Suspend low-value cards instead
of building an unpayable review debt.

## Four retrieval forms

- **Reconstruction:** implement or diagram from a blank start.
- **Discrimination:** choose between plausible designs and justify rejection.
- **Diagnosis:** explain a symptom and collect decisive evidence.
- **Transfer:** apply to a changed domain, boundary, or failure condition.

Rotate forms. Repeatedly recalling the same sentence creates narrow familiarity.

## Interleaving rules

Mix skills that must be distinguished in real work:

- validation vs authorization;
- retry vs idempotency;
- client cancellation vs server transaction;
- optimistic UI vs optimistic concurrency;
- application checks vs database constraints;
- unit vs integration vs contract tests;
- authentication vs tenant/resource permission;
- transaction atomicity vs external-effect consistency.

Ask which mechanism applies before revealing the topic label.

## Project-derived cards

After each ticket, create at most two:

1. The misconception or decision most likely to recur.
2. The failure/debug path most costly to forget.

Examples:

- Draw checkout after commit succeeds and response is lost.
- Write the SQL/update condition that makes final-unit reservation atomic.
- Explain why UI-hidden controls do not authorize a resource.
- Design a test forcing an older search response to arrive last.
- Describe expand/backfill/contract migration across mixed application versions.

## Mode rotation

Retrieve through a different mode than initial learning when practical:

- learned from example → reconstruct or debug;
- learned visually → verbalize and implement;
- learned by building → draw and review;
- learned verbally → produce tests and runtime evidence;
- learned collaboratively → solve independently;
- learned with detailed structure → use only the ticket and acceptance cases.

This tests flexible access instead of dependence on the original cue.

## Monthly retention audit

Randomly select:

- two language/runtime topics;
- two Node/API/data topics;
- one React/accessibility topic;
- one test/debug topic;
- one security/operations topic;
- one prior project decision.

Give each 20 minutes without coaching notes. Score 0–3 using correct result,
mechanism explanation, failure case, and transfer. Route scores 0–1 to a new
representation and immediate project use; scores 2–3 remain spaced.

## AI role

AI may maintain dates, generate changed constraints, interview, or create
plausible wrong alternatives. It must not show the answer before retrieval.
Record whether the answer was independent, hinted, or reconstructed after feedback.

<!-- spaced-pack-link:start -->
## Spaced practice

Use the [ten-stage day 0–90 practice pack](spaced-packs/RETENTION-SYSTEM-SPACED-PACK.md) to retrieve, vary, and transfer this material instead of rereading it.
<!-- spaced-pack-link:end -->
