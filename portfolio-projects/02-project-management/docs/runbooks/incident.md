# Incident response: suspected tenant leak or queue failure

For suspected tenant leakage, declare severity 1, preserve correlation IDs/logs, disable affected endpoint or stop API, do not delete evidence, identify query and tenant scope, rotate exposed integration/session secrets, notify owners according to policy, and add a hostile regression before restoration. Query activity by organization and time; descriptions/tokens should not be in logs.

For queue failure, inspect counts by `kind,state,last_error`, stop the worker if attempts increase unexpectedly, correct permanent poison data or adapter configuration, then move only reviewed dead records to pending with attempts reset. Observe one batch before full recovery. Webhook receivers must tolerate duplicates.

Injected exercise: a delivery adapter throwing `simulated transient` leaves the job pending with incremented attempts and bounded delay; after the configured attempt ceiling it becomes visible as `dead`, avoiding a hot retry loop. Prevention is the state/attempt constraint and deterministic worker test.
