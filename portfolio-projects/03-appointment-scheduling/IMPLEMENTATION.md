# Implementation plan and risk log

1. Foundation: workspaces, strict TS, migration/seed, health, shutdown.
2. Vertical slice: catalog → recurring availability → slots → hold → confirmation → React.
3. Correctness: half-open buffers, signed tokens, idempotency, versioning, lifecycle, transactional reschedule.
4. Operations: expiry/reminder worker, retry/dead letter, logs, runbooks, CI.
5. Evidence: DST table, two-connection race, rollback, auth/HTTP, worker and build checks.

Top risks are double allocation, civil-time ambiguity, cross-tenant IDOR, reschedule partial failure, and duplicate notification. AI assistance level: 3 for implementation scaffolding. Independent oracles are the requirements, SQL transaction semantics, deterministic tests, strict compiler, and manual diff review. Rejected design: trusting signed tokens as proof of availability; they only identify a candidate and are revalidated transactionally.
