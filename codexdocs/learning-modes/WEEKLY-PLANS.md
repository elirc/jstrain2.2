# Weekly plan options

Choose a cadence that fits current capacity. All plans preserve build, review,
retrieval, and transfer; they vary session size and representation.

## Standard — five sessions, 12–18 hours

| Session | Work | Suggested mode |
| --- | --- | --- |
| 1 | Plan increment, cold diagnostic, targeted prerequisite | Structured + Example-first |
| 2 | First complete vertical slice | Build-first |
| 3 | Failure, concurrency, security, and accessibility | Visual + Challenge |
| 4 | Tests, code review, debug hunt | Collaborative + Challenge |
| 5 | Ship, demo, retro, spaced retrieval | Verbal teach-back |

Keep the main course allocation: roughly 70% project, 20% targeted exercises,
10% review and explanation.

## Intensive — six days, 25–35 hours

- Day 1: requirements, model, and one worked/faded example.
- Days 2–3: build two small reviewable vertical slices.
- Day 4: data/concurrency/security failure work.
- Day 5: review, debug hunt, performance or operations.
- Day 6: release, teach-back, delayed retrieval from earlier weeks.

Do not turn extra hours into larger diffs. Increase the number of feedback and
release cycles.

## Sustainable — four sessions, 6–10 hours

- Session 1: 30-minute diagnostic plus one targeted example/exercise.
- Session 2: 90-minute build slice.
- Session 3: 90-minute tests and failure injection.
- Session 4: 60-minute review, demo, and next-step setup.

One increment may span two weeks. Preserve quality gates rather than compressing scope.

## Minimum viable week — three sessions, 3–5 hours

- Session 1: select one acceptance example and produce failing evidence.
- Session 2: implement the smallest complete vertical behavior.
- Session 3: add one high-risk negative case, review, explain, and schedule retrieval.

Defer optional UI polish and breadth. Do not defer authorization, durable
invariants, or proof for the behavior you ship.

## Variable-capacity week

Prepare queues:

| Capacity | Tasks |
| --- | --- |
| Green | Vertical slice, concurrency test, migration, incident |
| Yellow | Domain rule, API test, accessible state, diagram, focused review |
| Red | Retrieval prompts, example annotation, restart note, test-case design |

Aim for one Green or two Yellow project artifacts plus three short retrievals.
If the whole week is Red, preserve health and continuity, then replan scope.

## Spaced-review queue

At each session start, select at most three due items:

```text
1 day: reproduce core mechanism
3 days: changed example
7 days: mixed/interleaved problem
21 days: project or incident transfer
```

Failed conceptual recall returns to one day with a different representation.
Minor syntax lookup does not reset mastery if the model and design remain sound.

## Weekly retro

Answer with evidence:

1. Which mode produced the most transferable work per hour?
2. Which scaffold can be faded next week?
3. Which failure repeated across modes?
4. What survived delayed retrieval?
5. Did accessibility or energy create a barrier that should change the environment?
6. What is next week's single project outcome and highest-risk proof?

<!-- spaced-pack-link:start -->
## Spaced practice

Use the [ten-stage day 0–90 practice pack](spaced-packs/WEEKLY-PLANS-SPACED-PACK.md) to retrieve, vary, and transfer this material instead of rereading it.
<!-- spaced-pack-link:end -->
