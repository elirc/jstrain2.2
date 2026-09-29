# Threat model and authorization matrix

Assets are tenant inventory, customer/order snapshots, supplier contact data, audit history, and availability integrity. Trust boundaries are browser/API, token/membership, API/SQLite, and worker/job payload. Leading threats are forged tenant IDs, IDOR, overposting, injection, replay, oversell, CSV formula injection, and leaked secrets.

Mitigations include Zod strict schemas, parameterized SQL, organization predicates from membership, permission middleware, durable idempotency, SQL checks, immutable movement triggers, bounded request/list sizes, safe error envelopes, and correlation-safe logs. Residual high risks for production are demo-token forgery/replay, no password hashing/rate limiting, and CSV spreadsheet formula interpretation; deploy only after replacing auth and neutralizing formula-leading export cells.

| Capability | Admin | Catalog | Purchasing | Warehouse | Sales | Viewer |
| --- | :---: | :---: | :---: | :---: | :---: | :---: |
| Catalog mutate | ✓ | ✓ | | | | |
| Purchase draft/submit | ✓ | | ✓ | | | |
| Receive | ✓ | | ✓ | ✓ | | |
| Create/cancel sale | ✓ | | | | ✓ | |
| Ship/return | ✓ | | | ✓ | | |
| Adjust/transfer | ✓ | | | ✓ | | |
| Reports/ledger | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

Hidden UI controls are convenience only; the API enforces every row.
