# Implementation plan and risk register

The release is delivered in vertical slices: foundation/identity/catalog; ledger/stock; purchasing/receipts; sales/reservation/fulfillment; adjustments/transfers/returns; reports/UI; worker/operations; release evidence.

| Risk | Contract | Primary evidence |
| --- | --- | --- |
| Overselling | Reservation checks and writes occur inside one serialized SQL transaction | deterministic last-unit test |
| Half-applied receipt | balance, movement, line, state, audit, idempotency share one transaction | injected rollback test |
| Duplicate delivery | operation-scoped key and response persist atomically | receipt/sale idempotency tests |
| Tenant leak | tenant comes from authenticated membership and every query scopes it | real HTTP negative test |
| Projection drift | movement is append-only; worker compares balance to movement sum | trigger and worker tests |

AI assistance level: Level 3 for this bounded portfolio implementation. The test oracle is the documented SQL invariants and independent database observations. No claim is made that this fulfills the course's Level 0 learning requirement.
