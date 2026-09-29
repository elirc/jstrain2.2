# Team and maintenance simulation

These exercises create the uncertainty missing from isolated coding drills.
Run one review or debugging simulation every week and the full incident in
week 11.

## Pull-request simulation

For each project ticket:

1. Write the ticket assumptions before coding.
2. Create a branch and small commits.
3. Fill in `templates/PR.md`.
4. Ask an AI reviewer for evidence-backed defects, not a rewrite.
5. Classify each comment:
   - defect;
   - missing requirement;
   - maintainability tradeoff;
   - preference;
   - incorrect claim.
6. Respond with a change or reasoned rejection.
7. Review the final aggregate diff before merge.

Never make an unrelated cleanup invisible inside a feature PR. Create a
separate ticket when it deserves separate reasoning.

## Ambiguous ticket exercise

Give AI this prompt without showing it your preferred design:

```text
Act as a product manager. Give me an intentionally incomplete change request
for RelayDesk. Answer only the questions I ask, and occasionally reveal a
constraint that a real stakeholder might initially omit. Do not discuss code.
```

Your goal is not to guess the hidden answer. Produce:

- user outcome;
- acceptance criteria;
- non-goals;
- error and permission behavior;
- migration/compatibility concerns;
- observability needed to know it works;
- vertical implementation slices.

## Unfamiliar-code debugging drill

Ask AI or another person to choose a solved debug hunt or introduce one defect
on a temporary RelayDesk branch.

Use this sequence:

1. Restate the symptom without causal language.
2. Reproduce it reliably.
3. Reduce the failing surface.
4. List competing hypotheses.
5. Run one discriminating experiment.
6. Trace the first incorrect state backward.
7. Make the smallest safe correction.
8. Add a regression test at the boundary that should have caught it.
9. Explain why existing tests missed it.

Score the diagnosis, not typing speed.

## Code-review drills

Rotate focus so review does not become a style scan:

- Week 2: contracts and error behavior.
- Week 3: async ordering and cleanup.
- Week 4: SQL, transactions, and migration safety.
- Week 5: accessibility and user-visible states.
- Week 6: stale data and lost updates.
- Week 7: authorization and data exposure.
- Week 8: retry, timeout, and idempotency interactions.
- Week 9: test strength and coupling.
- Week 10: scope, compatibility, and rollout.
- Week 11: logs, limits, and production diagnosis.

## Incident scenarios

Choose one randomly. Do not inspect the cause until you have observed the
system.

### Scenario A — duplicate webhook storm

Customers report repeated notifications after a provider outage. Delivery
workers have been retrying for two hours.

Possible injected causes: missing durable idempotency constraint, retrying a
permanent response, or marking success after a non-atomic write.

### Scenario B — requester sees internal content

A requester reports seeing an internal note after an agent viewed the same
ticket.

Possible injected causes: authorization-blind cache key, filtering after
serialization, or UI-only hiding.

### Scenario C — ticket queue latency spike

P95 latency grew from 100 ms to 2 seconds after data volume increased.

Possible injected causes: missing composite index, offset pagination, N+1
requester lookups, or unbounded search.

### Scenario D — silent lost assignment

Two agents assign the same ticket near-simultaneously. Both clients report
success, but one change disappears.

Possible injected causes: missing expected version, read-modify-write across
an await, or an unconditional SQL update.

## Incident rules

1. Start a timeline immediately.
2. Separate observations, hypotheses, and actions.
3. Prefer reversible mitigation before a perfect fix.
4. Do not destroy evidence to make the symptom disappear.
5. State user impact and security/data-loss risk.
6. Verify recovery from the user's perspective.
7. Write root cause as a mechanism, not a person's mistake.
8. Create concrete prevention, detection, and response actions.

Use `templates/INCIDENT.md` for the report.

## Collaboration without another developer

AI can play product manager, reviewer, interviewer, or incident commander, but
only one role at a time. Give each role limited information. A single AI
response that invents the ticket, implementation, test, review, and approval
is not a team simulation; it is one shared blind spot wearing five hats.

