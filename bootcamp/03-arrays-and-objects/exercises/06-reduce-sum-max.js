// ─────────────────────────────────────────────────────────────────────────
//  06 · reduce · sum and max                               ★☆☆ warm-up
//  concepts: reduce · accumulators · initial value
//  run: node 06-reduce-sum-max.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `reduce` folds a list down to a single value. You give it a callback
//  (accumulator, item) and a starting value.
//
//      sum([1, 2, 3, 4])      → 10
//      sum([])                → 0
//      average([2, 4, 9])     → 5
//      average([])            → 0
//      priciest(PRODUCTS)     → the Monitor object
//      priciest([])           → null
//
//  Always pass the initial value: `[].reduce((a, b) => a + b)` throws
//  "Reduce of empty array with no initial value".

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
  throw new Error('TODO');
}

export function average(numbers) {
  throw new Error('TODO');
}

export function priciest(products) {
  throw new Error('TODO');
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
