// ─────────────────────────────────────────────────────────────────────────
//  10 · the guard that let it through                      ★★★ stretch
//  concepts: type predicates · unchecked promises · array validation
//  run: node ../run.js exercises/10-type-guard-bug.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  A cart arrives from the browser as `unknown`. `isCart` decides whether
//  it is really a cart, and `totalCents` adds it up — or returns null if
//  the payload is not a cart at all. The rules:
//
//      • every line must be a complete CartItem, or the whole cart is out
//      • a cart with no lines is still a cart, and it costs 0
//
//      totalCents({ id:'c1', items:[{ sku:'a', qty:2, priceCents:500 }] })
//                                                              → 1000
//      totalCents({ id: 'c2', items: [] })                     → 0
//      totalCents({ id:'c3', items:[good, { sku: 'b' }] })      → null
//      totalCents('nope')                                       → null
//
//  tsc believes every line of this file — a predicate signature is a
//  promise it cannot check, and this one is not kept. Two tests fail.
//  Find the bug, change as little as possible.
//
//  hint: the two failures look unrelated: one payload is rejected that
//  should be accepted, one is accepted that should be rejected. Look for
//  the single expression that could produce both, and check it against an
//  empty array by hand.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface CartItem {
  sku: string;
  qty: number;
  priceCents: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isCartItem(value: unknown): value is CartItem {
  return (
    isRecord(value) &&
    typeof value.sku === 'string' &&
    typeof value.qty === 'number' &&
    typeof value.priceCents === 'number'
  );
}

export function isCart(value: unknown): value is Cart {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    Array.isArray(value.items) &&
    value.items.some(isCartItem)
  );
}

export function totalCents(value: unknown): number | null {
  if (!isCart(value)) return null;
  return value.items.reduce(
    (sum, item) => sum + item.qty * item.priceCents,
    0
  );
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('a clean cart totals its lines', () => {
  eq(
    totalCents({
      id: 'c1',
      items: [
        { sku: 'a', qty: 2, priceCents: 500 },
        { sku: 'b', qty: 1, priceCents: 250 },
      ],
    }),
    1250
  );
});

test('an empty cart is a cart, and it is free', () => {
  eq(totalCents({ id: 'c2', items: [] }), 0);
  ok(isCart({ id: 'c2', items: [] }));
});

test('one broken line spoils the whole cart', () => {
  eq(
    totalCents({
      id: 'c3',
      items: [{ sku: 'a', qty: 2, priceCents: 500 }, { sku: 'b' }],
    }),
    null
  );
});

test('a payload that is not an object is not a cart', () => {
  eq(totalCents('nope'), null);
  eq(totalCents(null), null);
  eq(totalCents([{ sku: 'a', qty: 1, priceCents: 1 }]), null);
});

test('items has to be an array', () => {
  eq(totalCents({ id: 'c4', items: 'a,b' }), null);
  eq(totalCents({ id: 'c5' }), null);
});

test('a cart with no id is not a cart', () => {
  eq(totalCents({ items: [{ sku: 'a', qty: 1, priceCents: 1 }] }), null);
});

test('isCartItem checks the types, not just the keys', () => {
  ok(!isCartItem({ sku: 'a', qty: '2', priceCents: 500 }));
  ok(!isCartItem({ sku: 'a', qty: 2 }));
  ok(isCartItem({ sku: 'a', qty: 2, priceCents: 500 }));
});

// ──────────────────────────── type tests ─────────────────────────────────
//
//  These already pass — in the broken file and in the fixed one. That is
//  the whole point of the module: the type layer is satisfied either way.

type _t1 = Expect<Equal<ReturnType<typeof totalCents>, number | null>>;

function _typeTests() {
  const wire: unknown = JSON.parse('{}');

  // @ts-expect-error — unknown has no members until a guard speaks
  wire.items;

  if (isCart(wire)) {
    // tsc takes the predicate at its word — every time, no questions
    const items: CartItem[] = wire.items;
    const first: number = items[0].qty;
    use(items, first);
  }
}
use(_typeTests);
