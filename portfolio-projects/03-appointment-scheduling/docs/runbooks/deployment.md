# Deployment and rollback

1. Back up `data/schedule.db` and verify the copy opens. Run `npm ci`, `npm run check`, then `npm run migrate` against a staging copy.
2. Stop API and worker, deploy immutable build assets, run migrations once, start API, verify `/health/ready`, then start worker and perform a demo booking.
3. On application failure, stop traffic and worker and restore the previous artifact. Migrations are additive; application rollback is compatible. On data failure, restore the verified backup and reconcile appointments created after it from audit history.

Never run two schema migrators simultaneously. SIGTERM allows ten seconds for API drain. Treat repeated `SLOT_TAKEN`, SQLite busy errors, worker dead letters, or readiness failures as release gates.
