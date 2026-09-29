// ─────────────────────────────────────────────────────────────────────────
//  14 · sorting without mutating — SOLUTION                ★★☆ core
//  run: node 14-sort-without-mutating.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three ways to copy first — spread, `slice()`, or the newer
//  `toSorted`/`toReversed`/`with`/`toSpliced` family, which allocate a copy
//  for you and never touch the receiver. `topN` shows the standard shape:
//  copy, sort descending, `slice(0, n)` — and `slice` clamps politely, so
//  n larger than the list is not an error. Freezing the fixture is the
//  cheap way to turn an accidental mutation into a loud TypeError instead
//  of a bug that surfaces three components away.

import { test, eq, ok } from '../../_lib/check.js';

const PRODUCTS = Object.freeze([
  { id: 'p1', name: 'Keyboard',     category: 'input',   price: 89,  stock: 12 },
  { id: 'p2', name: 'Mouse',        category: 'input',   price: 45,  stock: 0 },
  { id: 'p3', name: 'Monitor',      category: 'display', price: 320, stock: 4 },
  { id: 'p4', name: 'USB-C Hub',    category: 'adapter', price: 29,  stock: 31 },
  { id: 'p5', name: 'Laptop Stand', category: 'desk',    price: 55,  stock: 7 },
  { id: 'p6', name: 'Webcam',       category: 'video',   price: 62,  stock: 0 },
  { id: 'p7', name: 'HDMI Cable',   category: 'adapter', price: 12,  stock: 58 },
  { id: 'p8', name: 'Desk Lamp',    category: 'desk',    price: 34,  stock: 3 },
]);

export function sortedCopy(numbers) {
  return numbers.toSorted((a, b) => a - b);
}

export function topN(products, n) {
  return [...products].sort((a, b) => b.price - a.price).slice(0, n);
}

export function reversedCopy(items) {
  return items.toReversed();
}

// ──────────────────────────── tests ──────────────────────────────────────

test('sortedCopy sorts numerically', () => {
  eq(sortedCopy([3, 10, 2]), [2, 3, 10]);
});

test('sortedCopy survives a frozen input and leaves it alone', () => {
  const nums = Object.freeze([3, 1, 2]);
  eq(sortedCopy(nums), [1, 2, 3]);
  eq(nums, [3, 1, 2]);
});

test('topN returns the n most expensive, priciest first', () => {
  eq(topN(PRODUCTS, 3).map((p) => p.name), ['Monitor', 'Keyboard', 'Webcam']);
});

test('topN does not reorder the frozen catalogue', () => {
  topN(PRODUCTS, 3);
  eq(PRODUCTS[0].id, 'p1');
});

test('topN with n larger than the catalogue returns everything', () => {
  eq(topN(PRODUCTS, 99).length, 8);
});

test('topN with n = 0 returns an empty array', () => {
  eq(topN(PRODUCTS, 0), []);
});

test('reversedCopy reverses into a new array', () => {
  const letters = Object.freeze(['a', 'b', 'c']);
  const flipped = reversedCopy(letters);
  eq(flipped, ['c', 'b', 'a']);
  eq(letters, ['a', 'b', 'c']);
  ok(flipped !== letters);
});
