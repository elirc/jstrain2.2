# ADR 001: SQLite-first persistence

Status: accepted. SQLite enables deterministic setup with real constraints and transactions in this environment. PostgreSQL/Docker would better prove cross-process row locking but adds infrastructure uncertainty. We accept serialized single-instance writes and isolate SQL behind command functions. Before horizontal scale, migrate to PostgreSQL and use row locks in stable product/warehouse order.
