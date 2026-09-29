# Backup and restore

Quiesce writers, run SQLite `VACUUM INTO` to a dated file, hash it, and copy the database plus hash to separate storage. Rehearse restore by opening a copy, running `PRAGMA integrity_check`, applying migrations, comparing stock projections to movement sums, and executing `npm run smoke` against it. Recovery point equals the most recent backup; this local release has no continuous replication.
