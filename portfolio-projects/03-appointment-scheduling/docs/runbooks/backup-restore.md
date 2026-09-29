# Backup and restore

Quiesce API/worker, then use SQLite `.backup` or copy the database plus WAL/SHM as one consistent set. Record SHA-256, timestamp, schema version, and restore owner. Restore into a new path, run `PRAGMA integrity_check`, verify migration rows and appointment counts, start with `DATABASE_PATH` pointing to it, and perform read-only schedule checks before reopening booking. Keep the failed database for forensics; never overwrite the only copy.
