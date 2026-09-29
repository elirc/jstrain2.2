# Module 10 — Operations and delivery

Pair with: RelayDesk increments 10–12.

## Why this matters

Code provides value only when it runs for users. Operating software means
knowing what version is deployed, whether it is healthy, what it is doing,
how it fails, and how to recover without improvising destructive actions.

Deployment is not a final ceremony. It feeds design: configuration, migrations,
shutdown, logs, limits, and rollback all become concrete once another
environment must run the system.

## Observability answers questions

- Logs explain individual events with structured context.
- Metrics show aggregated rates, errors, saturation, and latency.
- Traces connect work across boundaries where available.

Collect signals for questions you expect to ask. Logging every object is not
observability; it is noise, cost, and often a privacy leak.

Useful request context includes request ID, route template, status, duration,
caller/workspace identifiers where safe, and error classification. Avoid raw
tokens, passwords, sensitive bodies, and unbounded payloads.

## Health checks have consumers

Liveness answers whether the process should be restarted. Readiness answers
whether it should receive traffic. A dependency outage may make the service
unready without making it dead. A health endpoint that always says OK is
decoration; one that restarts every process during a database outage can make
the incident worse.

## Delivery requires compatibility

Application and database versions overlap during deployments. Prefer changes
that allow old and new versions to coexist: expand schema, deploy compatible
code, backfill, then enforce/contract. A rollback plan must account for data
already written in the new shape.

## Incidents require evidence discipline

Separate:

- observation: a measured or directly seen fact;
- hypothesis: a possible mechanism;
- action: a change or experiment;
- result: new evidence.

Fast random changes destroy causality. Prefer reversible mitigation, preserve
evidence, and verify recovery from the user's perspective.

## Common failure patterns

- Environment values read throughout the code without startup validation.
- Logs containing secrets or high-cardinality/unbounded content.
- Health check depending on every optional integration.
- Migration automatically run by every application instance concurrently.
- Deployment requiring a synchronized client/server/database switch.
- Retry storm during dependency failure.
- Process termination interrupting in-flight writes.
- Performance fix proposed without a baseline.
- Root cause described only as “developer error.”

## Exercise 1 — configuration parser (core)

Build a startup configuration module for environment, port, database URL,
session secret, web origin, log level, webhook timeout, and version.

Constraints:

- Raw environment is treated as untrusted strings.
- Required values, enums, integer ranges, URLs, and secret minimums are
  validated.
- Production and development defaults differ deliberately.
- Errors name invalid keys but never echo secrets.

Proof: table tests and a startup failure demonstration.

Debrief: why is scattered `process.env` access harder to review and operate?

AI level: 1.

## Exercise 2 — structured logging contract (core)

Define events for request completion, unexpected error, forbidden access,
database failure, and webhook attempt.

Constraints:

- Separate stable event name, severity, identifiers, measurements, and error
  details.
- Redact or omit sensitive fields through explicit policy.
- Avoid dynamically generated message strings as the only structure.
- Request IDs cross the API/error/log boundary.

Proof: captured log assertions for success and each failure class.

Debrief: which fields should be metrics rather than repeated log searches?

AI level: 1.

## Exercise 3 — health and shutdown drill (applied)

Run the service, start a controlled long request, initiate shutdown, and prove
new traffic stops while in-flight work receives a bounded drain period.

Constraints:

- Liveness and readiness transition intentionally.
- Database and worker close order is documented.
- Forced deadline path is observable.
- Repeated shutdown signals do not duplicate cleanup.

Proof: automated coordination test and operational timeline.

Debrief: what user-visible outcomes are possible for work interrupted after
the database commit but before the response?

AI level: 2 after your shutdown state machine.

## Exercise 4 — compatible release plan (applied)

Plan deployment of the new non-null SLA due time across database, API, worker,
and web client.

Constraints:

- Old and new application versions overlap.
- Migration/backfill ownership is explicit.
- Monitoring, abort criteria, forward recovery, and rollback are included.
- Client handles records before and after backfill.

Proof: phased runbook and compatibility matrix.

Debrief: after new-format data is written, when is rolling back code alone
unsafe?

AI level: 2 after your first plan.

## Exercise 5 — evidence-led performance investigation (review)

Investigate a ticket-list latency regression.

Constraints:

- Capture request timing distribution, query count/timing, data volume, and
  system saturation before changing code.
- Maintain competing hypotheses until an experiment discriminates them.
- Measure the same workload after the fix.
- Check correctness and resource tradeoffs.

Proof: investigation log with observations/hypotheses, before/after evidence,
and regression guard.

Debrief: which initially plausible optimization would not have addressed the
measured bottleneck?

AI level: 2; AI may propose hypotheses but must label inference.

## Exercise 6 — incident and postmortem (review)

Run one scenario from `../07-TEAM-SIMULATION.md` with AI or another person
controlling hidden cause and evidence.

Constraints:

- Maintain a timeline.
- Choose mitigation separately from permanent correction.
- Preserve data/evidence and avoid destructive shortcuts.
- Verify recovery externally.
- Produce prevention, detection, and response actions with owners/evidence.

Proof: completed incident report, regression check, and five-minute review.

Debrief: what changed in your mental model, and which system signal was
missing?

AI level: AI may act as incident controller, but you make severity and action
decisions.

## Project transfer

Apply configuration/logging early enough to help development, then use the
full delivery discipline in RD-1001, RD-1101–1103, and RD-1201–1204.

