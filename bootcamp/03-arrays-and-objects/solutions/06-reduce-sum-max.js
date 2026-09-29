// ─────────────────────────────────────────────────────────────────────────
//  06 · reduce · sum and max — SOLUTION                    ★☆☆ warm-up
//  run: node 06-reduce-sum-max.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the accumulator is whatever you decide it is — a number for
//  `sum`, the best-so-far object for `priciest`. The initial value does two
//  jobs: it fixes the type of the accumulator and it defines the answer for
//  an empty list. Skip it and reduce uses element 0 as the seed, which is
//  both a different type sometimes and a hard crash on an empty array.
//  `priciest` seeds with null and treats "no best yet" as "take this one".

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

export function sum(numbers) {
  return numbers.reduce((total, n) => total + n, 0);
}

export function average(numbers) {
  if (numbers.length === 0) return 0;
  return numbers.reduce((total, n) => total + n, 0) / numbers.length;
}

export function priciest(products) {
  return products.reduce(
    (best, p) => (best === null || p.price > best.price ? p : best),
    null
  );
}

// ──────────────────────────── tests ──────────────────────────────────────

test('sum adds up every number', () => {
  eq(sum([1, 2, 3, 4]), 10);
});

test('sum of an empty list is 0, not a crash', () => {
  eq(sum([]), 0);
});

test('sum works over prices pulled off the catalogue', () => {
  eq(sum(PRODUCTS.map((p) => p.price)), 646);
});

test('average divides the total by the count', () => {
  eq(average([2, 4, 9]), 5);
});

test('average of an empty list is 0 - no division by zero', () => {
  eq(average([]), 0);
});

test('priciest returns the most expensive product', () => {
  eq(priciest(PRODUCTS).name, 'Monitor');
});

test('priciest of an empty catalogue is null', () => {
  eq(priciest([]), null);
});
