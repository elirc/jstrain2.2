# Entity relationship diagram

```mermaid
erDiagram
 ORGANIZATION ||--o{ MEMBERSHIP : has
 USER ||--o{ MEMBERSHIP : holds
 ORGANIZATION ||--o{ PRODUCT : owns
 ORGANIZATION ||--o{ WAREHOUSE : owns
 PRODUCT ||--o{ STOCK_LEVEL : projected_at
 WAREHOUSE ||--o{ STOCK_LEVEL : contains
 STOCK_LEVEL ||--o{ STOCK_MOVEMENT : explained_by
 PURCHASE_ORDER ||--|{ PURCHASE_LINE : contains
 SALES_ORDER ||--|{ SALES_LINE : snapshots
 SALES_LINE ||--o{ RESERVATION : allocates
 SALES_ORDER ||--o{ SHIPMENT : fulfills
 SHIPMENT ||--|{ SHIPMENT_LINE : contains
 SHIPMENT ||--o{ RETURN : permits
```

Key constraints: SKU and warehouse code are unique per organization; quantities are positive on lines; stock is nonnegative and `reserved <= on_hand`; movements reject update/delete through triggers; idempotency is unique by organization, scope, and key.
