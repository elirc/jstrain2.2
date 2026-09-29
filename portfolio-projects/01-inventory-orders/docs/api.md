# HTTP API reference

Protected calls use `Authorization: Bearer <token>` and duplicate-sensitive commands require `Idempotency-Key`. Errors are `{ "error": { "code", "message", "details?", "correlationId" } }`.

Resources: `GET/POST /api/products`, `GET/POST /api/warehouses`, `GET/POST /api/suppliers`, `GET /api/stock`, `GET /api/stock/ledger`. Commands: `POST /api/stock/adjust`, `/api/purchase-orders`, `/api/purchase-orders/:id/submit`, `/api/purchase-orders/:id/receive`, `/api/sales-orders`, `/api/sales-orders/:id/ship`, `/api/sales-orders/:id/cancel`, `/api/transfers`, and `/api/returns`. Reports and files: `/api/reports/low-stock`, `/api/export/stock.csv`, `/api/import/products.csv` (strict header, 256 KiB/1000-row bounds, row outcomes), `/api/audit`. Operations: `/health/live`, `/health/ready`.

```http
POST /api/sales-orders
Authorization: Bearer <demo-token>
Idempotency-Key: checkout-42
Content-Type: application/json

{"warehouseId":"wh_main","customerName":"Ada","lines":[{"productId":"prod_widget","quantity":1,"unitPriceCents":1299}]}
```

Lists use deterministic secondary ordering and bounded `limit` (1–100), `offset` (0–10000), `q`, `sort`, and `direction` where applicable.
