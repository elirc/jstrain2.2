// ─────────────────────────────────────────────────────────────────────────
//  01 · shippingCost                                        ★☆☆ warm-up
//  concepts: guard clauses · early return · decision tables
//  run: node exercises/01-guard-clauses.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The legacy shipping rules are four levels of nesting deep:
//
//      if (order) {
//        if (SUPPORTED.has(order.country)) {
//          if (order.weightKg <= 30) {
//            if (order.express) { ... } else { ... }
//          }
//        }
//      }
//
//  Rewrite it flat. One guard per rule, each returning immediately, in
//  this exact order (order matters — express beats free shipping):
//
//      missing order                → null   ("we can't ship this")
//      country not 'US' or 'CA'     → null
//      weightKg > 30                → null   (freight only)
//      express                      → 25, or 35 when country is 'CA'
//      subtotal >= 100              → 0      (free standard shipping)
//      weightKg > 10                → 15
//      anything else                → 7
//
//      shippingCost({ country: 'US', weightKg: 2, subtotal: 20 })  → 7
//      shippingCost({ country: 'FR', weightKg: 2, subtotal: 20 })  → null
//
//  hint: a guard is `if (bad) return x;` — never `else`

import { test, eq } from '../../_lib/check.js';

export function shippingCost(order) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a missing order is not shippable', () => {
  eq(shippingCost(null), null);
});

test('refuses countries we do not ship to', () => {
  eq(shippingCost({ country: 'FR', weightKg: 2, subtotal: 20 }), null);
});

test('refuses freight-weight orders', () => {
  eq(shippingCost({ country: 'US', weightKg: 31, subtotal: 20 }), null);
});

test('express is a flat 25 in the US', () => {
  eq(shippingCost({ country: 'US', weightKg: 2, subtotal: 20, express: true }), 25);
});

test('express to Canada costs 35', () => {
  eq(shippingCost({ country: 'CA', weightKg: 2, subtotal: 20, express: true }), 35);
});

test('express beats free shipping', () => {
  eq(shippingCost({ country: 'US', weightKg: 2, subtotal: 500, express: true }), 25);
});

test('standard shipping is free over 100', () => {
  eq(shippingCost({ country: 'US', weightKg: 2, subtotal: 100 }), 0);
});

test('heavy standard orders cost 15, light ones 7', () => {
  eq(shippingCost({ country: 'CA', weightKg: 11, subtotal: 99 }), 15);
  eq(shippingCost({ country: 'CA', weightKg: 10, subtotal: 99 }), 7);
});
