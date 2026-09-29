// ─────────────────────────────────────────────────────────────────────────
//  01 · pure cart total                                     ★☆☆ warm-up
//  concepts: purity · no mutation · frozen inputs
//  run: node 01-pure-cart-total.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The old checkout code did `line.qty += 1` and `total += ...` in a loop,
//  and nobody could tell which screen changed the cart. Rewrite it pure:
//  read the cart, return new data, never touch the input.
//
//  Every cart the tests hand you is deep-frozen, so a stray mutation
//  throws a TypeError instead of quietly passing.
//
//      cartTotal([{ sku: 'mug', price: 12.5, qty: 2 }])    → 25
//      withItem(cart, { sku: 'ink', price: 3, qty: 1 })    → cart + 1 line
//      withItem(cart, { sku: 'mug', price: 12.5, qty: 1 }) → mug qty 2 → 3
//
//  withItem keeps an existing sku in its original position; it only bumps
//  that line's qty. Round money with Math.round(n * 100) / 100.

import { test, eq, ok } from '../../_lib/check.js';

const deepFreeze = (value) => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
  }
  return Object.freeze(value);
};

const cart = deepFreeze([
  { sku: 'mug', price: 12.5, qty: 2 },
  { sku: 'pen', price: 1.25, qty: 4 },
]);

export function cartTotal(cart) {
  throw new Error('TODO');
}

export function withItem(cart, item) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('sums price times quantity for every line', () => {
  eq(cartTotal(cart), 30);
});

test('an empty cart totals 0', () => {
  eq(cartTotal([]), 0);
});

test('rounds money to two decimals', () => {
  eq(cartTotal([{ sku: 'nut', price: 0.1, qty: 3 }]), 0.3);
});

test('appends a line for a sku the cart has never seen', () => {
  const next = withItem(cart, { sku: 'ink', price: 3, qty: 1 });
  eq(next.length, 3);
  eq(next[2], { sku: 'ink', price: 3, qty: 1 });
});

test('bumps the quantity of an existing sku in place', () => {
  const next = withItem(cart, { sku: 'mug', price: 12.5, qty: 1 });
  eq(next.length, 2);
  eq(next[0], { sku: 'mug', price: 12.5, qty: 3 });
});

test('leaves the original cart untouched', () => {
  const next = withItem(cart, { sku: 'mug', price: 12.5, qty: 1 });
  eq(cart[0].qty, 2);
  ok(next !== cart, 'must return a new array');
});

test('shares the lines it did not change with the original', () => {
  const next = withItem(cart, { sku: 'mug', price: 12.5, qty: 1 });
  ok(next[1] === cart[1], 'untouched lines can be reused by reference');
});
