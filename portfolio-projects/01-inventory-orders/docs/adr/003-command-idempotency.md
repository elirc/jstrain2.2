# ADR 003: Command-scoped durable idempotency

Status: accepted. Client retries can occur after an ambiguous commit. A unique organization/scope/key row stores the original JSON response within the business transaction. Request hashing would reject key reuse with changed payload and is preferable in production; this release documents that callers must not reuse a key for a different intent.
