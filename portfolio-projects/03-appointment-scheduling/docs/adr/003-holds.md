# ADR 003: five-minute provisional holds

Status: accepted. Atomic direct confirmation is simpler but gives customers no protected review interval. Long reservations waste scarce capacity. Use a five-minute server-clock hold with an idempotency key. Confirmation atomically creates an appointment and marks the hold confirmed. The worker idempotently expires stale holds. Future policy may vary hold duration by service, but clients must never choose it.
