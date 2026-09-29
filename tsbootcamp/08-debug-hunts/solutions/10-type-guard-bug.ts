// ─────────────────────────────────────────────────────────────────────────
//  10 · the guard that let it through — SOLUTION           ★★★ stretch
//  run: node ../run.js solutions/10-type-guard-bug.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//
//  BUG CLASS — a user-defined type guard whose body does not prove what
//  its signature promises.
//
//  THE TELL — two failures that look like opposites: a valid payload
//  rejected AND an invalid one accepted. Opposite symptoms from one
//  function mean the predicate itself is wrong, not the data — and the
//  one expression that can do both is `some` where `every` belongs.
//
//      [good, broken].some(isCartItem)   → true   ← lets a broken cart in
//      [].some(isCartItem)               → false  ← keeps a valid one out
//
//  `some` asks "is at least one item valid"; the contract says "are they
//  ALL valid". And the empty-array case is the classic asymmetry:
//  `[].every(fn)` is true (vacuously — no item fails), `[].some(fn)` is
//  false (no item passes). Any predicate over a collection deserves a
//  deliberate answer for the empty case; write that test first.
//
//  WHY TSC COULD NOT CATCH IT — `value is Cart` is an ASSERTION, not a
//  derivation. The compiler checks only that the function returns a
//  boolean; it never looks at the body to see whether the boolean means
//  what the annotation claims. From the call site's point of view a
//  predicate is a promise taken entirely on trust — which is what makes
//  guards so useful and so dangerous. Everything downstream then reads
//  `item.qty * item.priceCents` with total confidence and produces NaN.
//
//  THE FIX — one word, `some` → `every`. Both failures close, because
//  both came from the same expression.
//
//  The habit: a hand-written guard is the one place in a strict codebase
//  where the type system stops helping, so it is the one place that
//  earns per-field, per-element tests — including the empty one. (For
//  anything larger than this, a schema library — zod, valibot — derives
//  the type FROM the validator, so the two cannot drift apart.)

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
    value.items.every(isCartItem)
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
