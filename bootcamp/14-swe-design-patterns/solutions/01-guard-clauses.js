// ─────────────────────────────────────────────────────────────────────────
//  01 · shippingCost — SOLUTION                             ★☆☆ warm-up
//  concepts: guard clauses · early return · decision tables
//  run: node solutions/01-guard-clauses.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — handle the exits first so the happy path is never indented.
//  Every rule becomes one line you can read against the spec table, and
//  the last `return` is the default case. Nesting hides the order of the
//  rules; guards make it literal, top to bottom.
//  When NOT to use: when the branches are genuinely parallel (a real
//  dispatch on `type`), reach for a lookup table or polymorphism instead
//  of eight guards. Guards are for *exits*, not for dispatch.
//  In the wild: Node's `if (err) return callback(err)`, Express's
//  `if (!req.user) return res.status(401).end()`, every Go function ever.
//  Classic wrong turn: reordering the guards. `express` must be checked
//  before the free-shipping rule or express orders ship for $0.

import { test, eq } from '../../_lib/check.js';

const SUPPORTED = new Set(['US', 'CA']);

export function shippingCost(order) {
  if (!order) return null;
  if (!SUPPORTED.has(order.country)) return null;
  if (order.weightKg > 30) return null;
  if (order.express) return order.country === 'CA' ? 35 : 25;
  if (order.subtotal >= 100) return 0;
  if (order.weightKg > 10) return 15;
  return 7;
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
