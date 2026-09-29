# Performance note

Hypothesis: stock/catalog queries remain interactive for a local demonstration with thousands, not millions, of records. Indexes cover tenant/status/name/SKU and tenant/product/warehouse movement scans. No formal load run was performed, so no latency claim is made. Before the next release, generate 100k stock rows, capture `EXPLAIN QUERY PLAN`, p50/p95 latency, throughput, memory for CSV, and concurrent reservation contention; then compare before/after any index or streaming change.
