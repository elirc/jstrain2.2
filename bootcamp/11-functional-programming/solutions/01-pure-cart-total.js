// ─────────────────────────────────────────────────────────────────────────
//  01 · pure cart total — SOLUTION                          ★☆☆ warm-up
//  run: node 01-pure-cart-total.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a pure function reads its arguments and returns a value.
//  `reduce` replaces the `total += ...` accumulator; `map` replaces the
//  `cart[i].qty += n` write. The key move in withItem is `{ ...line, qty }`
//  — a new object for the one line that changed, while every other line is
//  returned untouched, so the new array shares structure with the old one.
//  Classic wrong turn: `const copy = [...cart]` and then `copy[0].qty += 1`.
//  Spread is SHALLOW — copy[0] is still the frozen original, and the write
//  throws. Copy the level you are changing, not just the outer container.

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
  const total = cart.reduce((sum, line) => sum + line.price * line.qty, 0);
  return Math.round(total * 100) / 100;
}

export function withItem(cart, item) {
  const known = cart.some((line) => line.sku === item.sku);
  if (!known) return [...cart, item];
  return cart.map((line) =>
    line.sku === item.sku ? { ...line, qty: line.qty + item.qty } : line
  );
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
