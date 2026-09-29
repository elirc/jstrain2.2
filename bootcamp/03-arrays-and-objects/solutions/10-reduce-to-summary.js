// ─────────────────────────────────────────────────────────────────────────
//  10 · reduce into an object — SOLUTION                   ★★☆ core
//  run: node 10-reduce-to-summary.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the accumulator does not have to be one number — seed it
//  with the full result shape and every field gets built in one pass. The
//  null seeds for min/max are deliberate: seeding with 0 would report a
//  minimum price of 0 for a catalogue whose cheapest item costs $12, and
//  seeding with Infinity leaks a non-JSON value into your API response.
//  `totalsByCategory` is `countBy` with `+ p.price` instead of `+ 1`; once
//  you see that, half of the lodash surface stops being mysterious.

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
  return products.reduce(
    (acc, p) => ({
      count: acc.count + 1,
      total: acc.total + p.price,
      min: acc.min === null || p.price < acc.min ? p.price : acc.min,
      max: acc.max === null || p.price > acc.max ? p.price : acc.max,
    }),
    { count: 0, total: 0, min: null, max: null }
  );
}

export function totalsByCategory(products) {
  return products.reduce((totals, p) => {
    totals[p.category] = (totals[p.category] ?? 0) + p.price;
    return totals;
  }, {});
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
