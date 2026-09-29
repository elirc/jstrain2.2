# Course map

## Outcome

Graduate with one credible, production-shaped application and repeated proof
that you can build, test, review, operate, and change it. Course completion is
earned by passing the capability rubric, not by reaching week 12.

## Weekly rhythm

Use five sessions each week. Increase or reduce session length, not the order.
If the default format creates a barrier, choose a temporary path with the
[learning-mode selector](learning-modes/00-MODE-SELECTOR.md). The mode changes
how you enter and represent the work; the week's project and evidence gates
remain unchanged.

1. **Plan:** read the increment, clarify assumptions, split the work, and
   predict risks.
2. **Build:** complete the smallest end-to-end slice.
3. **Build:** extend it, test error paths, and improve the design.
4. **Review:** inspect the diff, run checks, perform a debug hunt, and ask AI
   for adversarial review.
5. **Ship:** merge, deploy when scheduled, demo aloud, and write the retro.

Recommended time allocation:

- 70% RelayDesk tickets
- 20% routed exercises from the existing repository
- 10% verbal explanation, review, and reflection

The [adaptive weekly plans](learning-modes/WEEKLY-PLANS.md) provide intensive,
sustainable, minimum, and variable-capacity versions of this rhythm.
Use the [spaced-pack operating guide](learning-modes/spaced-packs/OPERATING-GUIDE.md)
to cap review debt and schedule changed-context retrieval through day 90.
The [whole-course spaced library](spaced-repetition-all/README.md) provides a
pack for every document. Activate only the packs routed by current project
risks; the library is intentionally not a completion checklist.

## Twelve-week sequence

| Week | Engineering focus | RelayDesk result | Exit evidence |
| --- | --- | --- | --- |
| 0 | Diagnostic and setup | Baseline score and learning plan | Diagnostic report with no hidden gaps |
| 1 | JS/TS mental models, Git, tests | Workspace and domain package | Strict build, first tests, clean commit history |
| 2 | Node, HTTP, async boundaries | Health endpoint and ticket creation | API contract and integration tests |
| 3 | API design and validation | Ticket list/detail/update | Stable error envelope; pagination and filters |
| 4 | SQL and persistence | Durable tickets, comments, migrations | Fresh DB and upgraded DB produce same schema |
| 5 | React foundations | Ticket list/detail/create UI | Accessible flows tested by user behavior |
| 6 | Full-stack state and concurrency | Search, assignment, optimistic update | Stale responses and conflicts handled honestly |
| 7 | Authentication and authorization | Login, roles, ownership rules | Negative authorization matrix passes |
| 8 | Reliability and integrations | Retry-safe webhook and activity feed | Timeout, retry, idempotency, and failure evidence |
| 9 | Test strategy and refactoring | Modularized service with contract seams | Refactor changes structure, not behavior |
| 10 | Maintenance and code review | Two ambiguous change requests | Small PRs with tradeoffs and review responses |
| 11 | Operations and incident response | Logs, metrics, health, performance fix | Written incident report and measured improvement |
| 12 | Release and interview translation | Public release candidate | Demo, README, architecture note, and rubric pass |

## Expanded module route

The backlog supplies integration work; the module library supplies deeper
explanation and controlled practice. Use modules just before or during their
paired project work:

| Course period | Module work |
| --- | --- |
| Foundations/week 1 | Modules 01–02: runtime contracts and TypeScript domain modeling |
| Weeks 2–3 | Modules 03–04: Node async boundaries and HTTP API design |
| Week 4 | Module 05: SQL and data integrity |
| Weeks 5–6 | Modules 06–07: React state and full-stack concurrency |
| Week 7 | Module 08: security and authorization |
| Week 9 | Module 09: testing and refactoring |
| Weeks 10–12 | Module 10 plus unfinished review exercises: operations and delivery |

The complete list is in [EXERCISE-INDEX.md](EXERCISE-INDEX.md). Never let
module practice displace the week's vertical RelayDesk result.

## Intensive six-week route

Combine weeks `1+2`, `3+4`, `5+6`, `7+8`, `9+10`, and `11+12`. Do not combine
their pull requests or skip either exit gate. Two small reviews teach more than
one giant diff.

## Gates

### Gate A — ready to build the API

- Explain value vs reference behavior, closures, `this`, promises, and the
  event loop without notes.
- Parse `unknown` input without `any` or unchecked casts.
- Write and diagnose a failing unit test.
- Use branches and commits without losing work.

### Gate B — ready to connect the UI

- An HTTP request crosses route, validation, service, and repository layers.
- Expected failures have intentional status codes and stable response shapes.
- SQL is parameterized; migration setup works from an empty database.
- Integration tests use real boundaries where the risk justifies them.

### Gate C — ready for maintenance simulation

- A user can complete the primary flow through the React application.
- Authentication is distinct from authorization.
- Loading, empty, error, retry, and stale-response states are visible.
- A deployable environment exists and has structured logs.

### Graduation gate

- Score at least 2 in every rubric category and 3 in at least six categories.
- Complete one feature and one debugging task without AI.
- Close a simulated production incident using evidence, not guessing.
- Review an AI-generated diff and catch at least one non-style defect.
- Explain the architecture and its compromises in ten minutes.

## When to use the old courses

Use them as a gym, not a trail to hike end to end. A project failure routes you
to a small exercise set, and then immediately back to RelayDesk. The routing
table is in [references/EXISTING-MATERIAL-MAP.md](references/EXISTING-MATERIAL-MAP.md).

For a compact original explanation before entering the larger drill library,
use [optimized-01-29/README.md](optimized-01-29/README.md). Its Tier-A route
mirrors the main course and every topic ends with a RelayDesk transfer task.
Each topic's [30-exercise mastery bank](optimized-01-29/mastery/README.md)
supports selective Explain → Predict → Implement → Test → Debug/review →
Apply practice. Use failed cold retrieval or project evidence to choose a rung;
do not substitute exercise completion for shipping the week's vertical slice.

## Weekly artifacts

Every week should leave behind:

- one to three reviewable pull requests or equivalent branch diffs;
- tests proving the week's riskiest behavior;
- one updated decision or architecture note when a meaningful choice occurred;
- one learning-log entry;
- one five-minute spoken demo;
- one weekly retro with next week's single biggest risk.
