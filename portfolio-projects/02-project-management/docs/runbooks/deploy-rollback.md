# Deploy and rollback

1. Back up `data/project-management.sqlite` with SQLite's online backup API or stop writers and copy the database plus WAL/SHM consistently.
2. From a clean checkout run `npm ci`, `npm run check`, and `DATABASE_PATH=... npm run migrate` against a restored backup.
3. Stop the worker, drain the API, run migrations once, deploy built artifacts, start API, confirm `/health/ready`, then start worker.
4. Smoke-test authentication, board read, a disposable task edit, and worker queue depth.

For application rollback, stop worker/API and deploy the previous artifact; migrations in this release are additive. If a future incompatible migration has committed, do not improvise down-SQL: restore the pre-deploy backup, validate counts/foreign keys, and replay independently recorded safe events. Record data-loss window and affected tenants.
