# ADR-001: SQLite behind a repository boundary

Status: accepted. PostgreSQL/Docker availability was uncertain and delivery required reproducible local setup. Node's built-in SQLite driver removes native dependency risk and supports real constraints/transactions. An in-memory fake was rejected because it cannot prove SQL behavior. PostgreSQL remains the production target: replace `BEGIN IMMEDIATE` with row/advisory locking, add composite tenant foreign keys, and run contract tests against both engines during transition.
