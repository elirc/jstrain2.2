# ADR 002: Immutable ledger plus balance projection

Status: accepted. Computing every view from movements is explainable but expensive; storing only balances loses history. Each transaction appends movements and updates a constrained `stock_levels` projection. Triggers prohibit movement mutation, and reconciliation detects drift. Corrections are compensating movements.
