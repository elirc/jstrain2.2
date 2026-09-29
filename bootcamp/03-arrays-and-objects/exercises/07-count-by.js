// ─────────────────────────────────────────────────────────────────────────
//  07 · countBy                                            ★★☆ core
//  concepts: reduce · tallying · object accumulators
//  run: node 07-count-by.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Build the tally helper every dashboard needs. `countBy` runs a key
//  function over each item and counts how often each key comes up.
//
//      countBy(PRODUCTS, (p) => p.category)
//        → { input: 2, display: 1, adapter: 2, desk: 2, video: 1 }
//      countBy(['a', 'b', 'a', 'c', 'a'], (w) => w)  → { a: 3, b: 1, c: 1 }
//      countBy([], (x) => x)                         → {}
//
//  The accumulator is a plain object `{}` this time, not a number.
//
//  hint: `counts[key] = (counts[key] ?? 0) + 1` — a bare `counts[key]++`
//  on a key you have not seen yet gives you NaN.

import { test, eq } from '../../_lib/check.js';

const PRODUCTS = [
  { id: 'p1', name: 'Keyboard',     category: 'input',   price: 89,  stock: 12 },
  { id: 'p2', name: 'Mouse',        category: 'input',   price: 45,  stock: 0 },
  { id: 'p3', name: 'Monitor',      category: 'display', price: 320, stock: 4 },
  { id: 'p4', name: 'USB-C Hub',    category: 'adapter', price: 29,  stock: 31 },
  { id: 'p5', name: 'Laptop Stand', category: 'desk',    price: 55,  stock: 7 },
  { id: 'p6', name: 'Webcam',       category: 'video',   price: 62,  stock: 0 },
  { id: 'p7', name: 'HDMI Cable',   category: 'adapter', price: 12,  stock: 58 },
  { id: 'p8', name: 'Desk Lamp',    category: 'desk',    price: 34,  stock: 3 },
];

export function countBy(items, keyFn) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('counts products per category', () => {
  eq(countBy(PRODUCTS, (p) => p.category), {
    input: 2,
    display: 1,
    adapter: 2,
    desk: 2,
    video: 1,
  });
});

test('counts repeated words', () => {
  eq(countBy(['a', 'b', 'a', 'c', 'a'], (w) => w), { a: 3, b: 1, c: 1 });
});

test('the key can be computed, not just read', () => {
  eq(countBy(PRODUCTS, (p) => (p.stock > 0 ? 'in' : 'out')), { in: 6, out: 2 });
});

test('an empty list tallies to an empty object', () => {
  eq(countBy([], (x) => x), {});
});

test('numeric keys become string keys', () => {
  const counts = countBy([1.2, 1.9, 2.5], (n) => Math.floor(n));
  eq(counts, { 1: 2, 2: 1 });
  eq(Object.keys(counts), ['1', '2']);
});

test('a single item tallies to 1, never NaN', () => {
  eq(countBy(['solo'], (w) => w), { solo: 1 });
});
