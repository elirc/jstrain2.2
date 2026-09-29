# Threat model and authorization matrix

Primary assets are tenant schedules, customer identity, private appointment history, and exclusive capacity. Trust boundaries are browser/API, identity/database, signed slot/API, worker/database, and simulated notification adapter.

| Threat | Control | Residual risk |
| --- | --- | --- |
| IDOR / tenant swap | organization derived from stored identity; resource queries include it; denials are 404 | demo authentication is forgeable by design |
| Slot-token tampering | server signature, strict decoding, tenant and current-overlap recheck | SHA-256 construction should become HMAC with rotated secret |
| Double booking | immediate transaction, overlap query, active-hold check, race test | only safe when every writer uses this repository |
| Replay | organization-scoped unique idempotency keys | key retention is indefinite |
| SQL injection | prepared statements; bounded sort/query shapes | manual review required for every new dynamic query |
| PII in logs/feed | safe context only; generic ICS summary; no notes | customer names appear in authorized JSON |
| Resource exhaustion | 32 KB JSON, 31-day/200-slot bounds, pagination cap | no rate limiter in local build |

| Capability | Admin | Scheduler | Provider | Reception | Customer |
| --- | :---: | :---: | :---: | :---: | :---: |
| Configure locations/services/resources/rules | yes | no* | no | no | no |
| Search/book | yes | yes | no | no | own |
| View daily schedule | yes | yes | assigned | yes | own |
| Check in | yes | yes | yes | yes | no |
| Complete/no-show/clinical notes | yes | yes* | assigned | no | no |
| Cancel/reschedule | yes | yes | assigned* | no | own |

`*` indicates the target policy; a few fine-grained provider/scheduler projections remain a documented implementation gap. Current configuration endpoint is intentionally admin-only.
