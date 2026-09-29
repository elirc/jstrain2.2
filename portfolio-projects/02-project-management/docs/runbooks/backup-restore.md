# Backup and restore drill

Back up at least daily and before migration. Retain seven daily and four weekly encrypted copies outside the host. Test monthly: restore to a new path, run `PRAGMA integrity_check`, `PRAGMA foreign_key_check`, compare organization/project/task/activity counts, start API against the restored path, and execute read-only smoke checks. Never overwrite the only current database during a drill. RPO is 24 hours and local-demo RTO is 60 minutes; production targets require continuous PostgreSQL archiving.
