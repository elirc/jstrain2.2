# Slot-search performance investigation

Hypothesis: overlap checks dominate as appointments grow because each generated candidate probes staff/resource intervals. The migration adds a partial `(staff_id, allocation_start_utc, allocation_end_utc)` index and bounds searches to 31 days/200 returned slots. Test workload assumption is 10 staff, 30-minute services, and 50k appointments.

Measurement is reproducible with `npm test`; the current suite confirms bounded results but does not yet report a stable benchmark because shared CI hardware would make the number misleading. Before the 50k threshold, capture `EXPLAIN QUERY PLAN`, p50/p95 over 100 warmed queries, and compare before/after indexes. Escalation threshold is p95 above 300 ms. PostgreSQL should use GiST range indexes and one set-based availability query rather than per-candidate probes.
