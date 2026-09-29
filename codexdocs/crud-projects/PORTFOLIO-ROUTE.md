# Portfolio route

## Build one primary system

Depth is the objective. A recruiter or senior engineer learns more from one
coherent system with difficult failure evidence than from eight unfinished
repositories. Choose one primary system, complete increments 1–10, then decide
whether increments 11–12 or a targeted secondary slice offers the best growth.

## Selection guide

Score each category from 0 (comfortable) to 3 (largest weakness). Select the
project whose strengths overlap your highest scores and whose domain you can
tolerate working in for several months.

| Weakness to target | Best choices |
| --- | --- |
| SQL transactions and invariants | Inventory, expenses, e-commerce |
| Concurrency and race conditions | Scheduling, inventory, e-commerce |
| React interaction and client state | Project management, scheduling |
| Authorization and tenant isolation | Project management, help desk, property maintenance |
| Workflow/state machines | Help desk, expenses, property maintenance |
| Time, recurrence, and background jobs | Scheduling, help desk |
| Exact money and external consistency | Expenses, e-commerce |
| Content hierarchy/versioning | Learning management |
| Files and cross-role privacy | Property maintenance, expenses, learning management |
| Operational incident handling | Help desk, inventory, e-commerce |

If scores are tied, choose inventory. It offers broad practice without payment
or calendar complexity dominating the entire project.

## Recommended 16-week path

This schedule assumes 12–18 focused hours per week. At intensive pace, combine
adjacent weeks but retain separate reviewable increments and exit evidence.

| Week | Focus | Expected result |
| --- | --- | --- |
| 0 | Choose domain, rewrite assumptions, risks, and non-goals | One-page charter and top-five risk test plan |
| 1 | Workspace, CI, configuration, schema baseline | Reproducible clean checkout and first deploy |
| 2 | Identity and authorization foundation | Authenticated vertical slice and denial tests |
| 3 | First core resource workflow | React → API → domain → database CRUD with audit |
| 4 | First state machine | Named commands, transition tests, history |
| 5 | Transactional invariant | Forced failure proves atomicity |
| 6 | Concurrency and idempotency | Deterministic race and duplicate-delivery tests |
| 7 | Advanced React workflow | Accessible async/conflict/retry states |
| 8 | Search, filters, pagination, report | Stable query contract and measured plan |
| 9 | Background worker/integration | Retry, backoff, dedupe, dead-letter recovery |
| 10 | Files, import/export, or provider adapter | Bounded input and partial-failure behavior |
| 11 | Security review and threat fixes | Threat model, authorization matrix, regression proof |
| 12 | Operations and performance | Metrics/log evidence and measured improvement |
| 13 | Compatible schema/API change | Migration and old/new compatibility matrix |
| 14 | Unfamiliar maintenance task | Small reviewed change without architecture rewrite |
| 15 | Incident and recovery exercise | Timeline, root cause, restore/rollback, prevention |
| 16 | Release candidate and technical defense | Demo, documentation, rubric, portfolio narrative |

Map the selected brief's numbered increments onto this route. Domain work may
move by a week, but security, concurrency, operations, change, and incident
work are mandatory.

## Ticket procedure

For every increment, split work into tickets small enough for one reviewable
diff. Each ticket should contain:

1. User or operator outcome.
2. Acceptance examples and explicit non-goals.
3. Domain and authorization rules.
4. Failure, concurrency, and retry behavior.
5. API/UI/data compatibility considerations.
6. Test evidence required.
7. Observability and rollback impact.
8. AI assistance level and independent explanation requirement.

Before coding, state the riskiest assumption. After coding, capture a test,
log, trace, query plan, screenshot, or demo proving the intended behavior.

## Targeted secondary slices

After the primary system is credible, select at most two slices rather than
starting another entire product:

- **Scheduling correctness:** availability, DST, holds, and last-slot race from project 03.
- **Tenant security:** memberships, guest projection, and organization switching from project 02.
- **Exact-money workflow:** allocation, policy snapshot, and concurrent approval from project 06.
- **Provider reliability:** fake payment, idempotency, webhook disorder, and reconciliation from project 08.
- **Content versioning:** draft/publish, pinned offering, and in-flight attempt from project 05.
- **Privacy projections:** internal/vendor/tenant comments and files from project 07.
- **SLA operations:** business calendar, pause, escalation, and ingestion incident from project 04.

Integrate a slice into the primary project when the domain can support it
honestly. Otherwise make a small standalone repository and explicitly compare
the architecture with your main system.

## Review simulations

At least once every two weeks, use one:

- Ask AI to generate a plausible but subtly wrong patch; review it before tests.
- Change a requirement after implementation and produce a compatibility plan.
- Remove a dependency response, slow it, duplicate it, or return malformed data.
- Review a large diff and split behavior change from cleanup.
- Have AI interview you about an ADR but do not let it answer for you.
- Explain an incident from symptoms to root cause using only collected evidence.

## Portfolio presentation

Your public presentation should lead with difficult evidence, not a feature list:

- the invariant and race you prevented;
- the authorization boundary and negative tests;
- the external failure made retry-safe;
- the migration deployed compatibly;
- the performance problem measured and improved;
- the incident diagnosed and prevented;
- an AI suggestion you rejected or corrected and why.

Avoid claiming production scale you did not test. State workload assumptions,
measurements, known limitations, and the next architectural threshold.

## Graduation test

The project is portfolio-ready when you can, without AI:

- add a small vertical feature while preserving existing contracts;
- diagnose one injected cross-layer defect;
- write a test that rejects a plausible wrong implementation;
- explain the data and concurrency model;
- trace authorization from identity to resource;
- describe deployment, failure detection, rollback, and recovery;
- review a proposed change for correctness, security, and maintainability.

