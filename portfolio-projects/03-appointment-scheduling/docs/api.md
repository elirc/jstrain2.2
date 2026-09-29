# API contract examples

All `/api` requests require `Authorization: Bearer demo:customer-1:customer`. Input objects are strict; unknown keys and malformed IDs, ISO dates, dates-times, or IANA zones return 422.

```http
GET /api/slots?serviceId=svc-1&locationId=loc-1&from=2026-09-08&to=2026-09-08&zone=America/Los_Angeles
POST /api/holds
{"slotToken":"<signed result token>","customerId":"customer-1","idempotencyKey":"hold-unique-001"}
POST /api/appointments/confirm
{"holdId":"hold-...","idempotencyKey":"booking-unique-001"}
POST /api/appointments/:id/reschedule
{"slotToken":"<new signed token>","expectedVersion":1,"reason":"Customer request"}
POST /api/appointments/:id/state
{"state":"checked_in","expectedVersion":1}
```

Other routes: `GET /api/catalog`, `GET /api/appointments?limit=50&offset=0`, `POST /api/appointments/:id/cancel`, `POST /api/availability/rules`, `POST /api/waitlist`, `GET /api/calendar.ics`, `GET /api/reports/utilization`, and health endpoints. A taken slot returns 409; an expired hold returns 410; authorization denials intentionally return 404.
