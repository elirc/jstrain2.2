# ADR 001: SQLite immediate transactions for allocation

Status: accepted for local release. Alternatives were in-memory locks (unsafe across processes), optimistic insert/retry without a database invariant (race-prone), and PostgreSQL exclusion constraints (strongest but adds local infrastructure). Use WAL, busy timeout, and `BEGIN IMMEDIATE` around overlap-check plus allocation write. This serializes writers and the deterministic two-connection test is the oracle. Move to PostgreSQL `tstzrange` exclusion constraints before multi-host deployment.
