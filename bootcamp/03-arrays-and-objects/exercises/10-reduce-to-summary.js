// ─────────────────────────────────────────────────────────────────────────
//  10 · reduce into an object                              ★★☆ core
//  concepts: reduce · single-pass aggregation
//  run: node 10-reduce-to-summary.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Four loops over the same array is three loops too many. Fold the whole
//  catalogue into one summary object in a single pass, then do the same
//  for a per-category total.
//
//      summarize(PRODUCTS)
//        → { count: 8, total: 646, min: 12, max: 320 }
//      summarize([])
//        → { count: 0, total: 0, min: null, max: null }
//      totalsByCategory(PRODUCTS)
//        → { input: 134, display: 320, adapter: 41, desk: 89, video: 62 }
//
//  min/max are prices; an empty catalogue has neither, hence null.
//
//  hint: seed the accumulator with the whole shape you want back, then
//  update the fields you care about on each item.

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

export function summarize(products) {
  throw new Error('TODO');
}

export function totalsByCategory(products) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('summarize counts and totals in one pass', () => {
  const s = summarize(PRODUCTS);
  eq(s.count, 8);
  eq(s.total, 646);
});

test('summarize tracks the cheapest and the priciest', () => {
  const s = summarize(PRODUCTS);
  eq(s.min, 12);
  eq(s.max, 320);
});

test('summarize of an empty catalogue has null min and max', () => {
  eq(summarize([]), { count: 0, total: 0, min: null, max: null });
});

test('summarize of one product reports that product twice', () => {
  eq(summarize([PRODUCTS[3]]), { count: 1, total: 29, min: 29, max: 29 });
});

test('totalsByCategory adds the prices inside each category', () => {
  eq(totalsByCategory(PRODUCTS), {
    input: 134,
    display: 320,
    adapter: 41,
    desk: 89,
    video: 62,
  });
});

test('the category totals add up to the grand total', () => {
  const totals = totalsByCategory(PRODUCTS);
  const grand = Object.values(totals).reduce((n, v) => n + v, 0);
  eq(grand, 646);
});

test('an empty catalogue has no category totals', () => {
  eq(totalsByCategory([]), {});
});
