// ─────────────────────────────────────────────────────────────────────────
//  08 · groupBy                                            ★★☆ core
//  concepts: reduce · grouping · array accumulators
//  run: node 08-group-by.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Same shape as `countBy`, except each bucket collects the items instead
//  of counting them.
//
//      groupBy(PRODUCTS, (p) => p.category)
//        → { input: [Keyboard, Mouse], display: [Monitor], ... }
//      groupBy([1, 2, 3, 4], (n) => (n % 2 ? 'odd' : 'even'))
//        → { odd: [1, 3], even: [2, 4] }
//      groupBy([], (x) => x)  → {}
//
//  Items keep their original order inside each bucket, and a bucket only
//  exists if something landed in it.
//
//  hint: create the bucket the first time you see a key — `(groups[key] ??=
//  []).push(item)` does both jobs in one expression.

import { test, eq, ok } from '../../_lib/check.js';

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

export function groupBy(items, keyFn) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('groups the catalogue by category', () => {
  const groups = groupBy(PRODUCTS, (p) => p.category);
  eq(Object.keys(groups), ['input', 'display', 'adapter', 'desk', 'video']);
});

test('each bucket keeps the items in catalogue order', () => {
  const groups = groupBy(PRODUCTS, (p) => p.category);
  eq(groups.adapter.map((p) => p.id), ['p4', 'p7']);
});

test('buckets hold the original objects, not copies', () => {
  const groups = groupBy(PRODUCTS, (p) => p.category);
  ok(groups.input[0] === PRODUCTS[0]);
});

test('a computed key groups numbers by parity', () => {
  eq(groupBy([1, 2, 3, 4, 5], (n) => (n % 2 ? 'odd' : 'even')), {
    odd: [1, 3, 5],
    even: [2, 4],
  });
});

test('an empty list groups to an empty object', () => {
  eq(groupBy([], (x) => x), {});
});

test('every item lands in exactly one bucket', () => {
  const groups = groupBy(PRODUCTS, (p) => p.category);
  const total = Object.values(groups).reduce((n, list) => n + list.length, 0);
  eq(total, PRODUCTS.length);
});

test('keys that nothing matched are absent, not empty arrays', () => {
  const groups = groupBy(PRODUCTS, (p) => p.category);
  eq('audio' in groups, false);
});
