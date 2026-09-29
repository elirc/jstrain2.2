# CRUD project progress and evidence

Copy this file into the selected project's documentation or maintain it here.
Replace placeholders with links to commits, pull requests, tests, deployments,
ADRs, diagrams, reports, and recordings.

## Project charter

- Selected project:
- Start date:
- Target release date:
- Weekly hours:
- Intended users:
- Primary learning weaknesses:
- Explicit non-goals:
- Top five risks:

## Increment tracker

| Increment | Status | Reviewable change | Strongest proof | Open risk |
| --- | --- | --- | --- | --- |
| 1 | not started | | | |
| 2 | not started | | | |
| 3 | not started | | | |
| 4 | not started | | | |
| 5 | not started | | | |
| 6 | not started | | | |
| 7 | not started | | | |
| 8 | not started | | | |
| 9 | not started | | | |
| 10 | not started | | | |
| 11 | not started | | | |
| 12 | not started | | | |

Allowed statuses: `not started`, `planned`, `in progress`, `in review`,
`released`, and `blocked`. “Code complete” is not released.

## Capability evidence

Score 0–3 using the main course [engineering rubric](../06-ENGINEERING-RUBRIC.md).

| Capability | Score | Best evidence | Weakness to test next |
| --- | ---: | --- | --- |
| Requirements and decomposition | 0 | | |
| TypeScript and domain modeling | 0 | | |
| React state and accessibility | 0 | | |
| Node and async lifecycle | 0 | | |
| HTTP and API contracts | 0 | | |
| SQL and data integrity | 0 | | |
| Concurrency and idempotency | 0 | | |
| Testing and debugging | 0 | | |
| Security and privacy | 0 | | |
| Operations and reliability | 0 | | |
| Git, review, and communication | 0 | | |

## Required artifact checklist

- [ ] Product README and limitations
- [ ] Reproducible setup from a clean checkout
- [ ] Architecture/data-flow diagram
- [ ] Entity relationship diagram
- [ ] API contract and example errors
- [ ] Authorization matrix
- [ ] Threat model
- [ ] Risk-based test strategy
- [ ] Three or more ADRs
- [ ] Deployment and rollback procedure
- [ ] Backup and restore rehearsal
- [ ] Graceful shutdown evidence
- [ ] Performance investigation
- [ ] Incident report and regression test
- [ ] Compatible migration demonstration
- [ ] Final demo and technical defense

## Risk-proof tracker

| Risk | Expected failure | Preventive design | Test/monitor evidence | Residual risk |
| --- | --- | --- | --- | --- |
| Authorization | | | | |
| Transaction failure | | | | |
| Concurrent mutation | | | | |
| Duplicate delivery | | | | |
| External timeout | | | | |
| Invalid/oversized input | | | | |
| Data migration | | | | |
| Resource exhaustion | | | | |
| Sensitive-data exposure | | | | |

## AI decision log

| Ticket | Assistance level | Suggestion accepted/rejected | Independent verification | Can explain cold? |
| --- | --- | --- | --- | --- |
| | | | | |

Record at least three rejected or materially corrected suggestions. The point
is not to oppose AI; it is to demonstrate that you own the decision.

## Debug and incident log

| Date | Symptom | Root cause | Regression evidence | Prevention/monitoring |
| --- | --- | --- | --- | --- |
| | | | | |

## Release gate

- [ ] A new engineer can run the project from the README.
- [ ] Required workflows work with seeded realistic data.
- [ ] Authorization failures and tenant boundaries are demonstrated.
- [ ] A forced race preserves the central invariant.
- [ ] Duplicate and ambiguous delivery is safe where required.
- [ ] Migrations work from blank and previous-version fixtures.
- [ ] Tests pass from a clean checkout without order dependence.
- [ ] Logs and metrics diagnose the injected incident.
- [ ] Restore or rollback has been rehearsed.
- [ ] Known limitations and scale assumptions are honest.
- [ ] You can perform the graduation test in `PORTFOLIO-ROUTE.md` without AI.

