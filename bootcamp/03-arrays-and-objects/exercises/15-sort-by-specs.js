// ─────────────────────────────────────────────────────────────────────────
//  15 · multi-key sortBy                                   ★★★ stretch
//  concepts: comparator composition · stable sort · localeCompare
//  run: node 15-sort-by-specs.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Every table header you have ever clicked needs this: sort by one field,
//  break ties with the next, some fields descending. Build the comparator
//  from a list of specs, where a leading '-' means descending.
//
//      sortBy(PRODUCTS, ['price'])              → cheapest first
//      sortBy(PRODUCTS, ['-price'])             → priciest first
//      sortBy(PRODUCTS, ['category', '-price']) → by category, then
//                                                 priciest within it
//      sortBy(items, [])                        → an unsorted copy
//
//  Numbers compare with < / >, strings with localeCompare(other, 'en').
//  Never mutate the input.
//
//  hint: turn each spec into its own comparator function first, then walk
//  that list and return the first non-zero answer.

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

const ids = (list) => list.map((p) => p.id);

export function sortBy(items, specs) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('one spec sorts ascending by that field', () => {
  eq(ids(sortBy(PRODUCTS, ['price'])), [
    'p7', 'p4', 'p8', 'p2', 'p5', 'p6', 'p1', 'p3',
  ]);
});

test('a leading minus sorts descending', () => {
  eq(ids(sortBy(PRODUCTS, ['-price'])).slice(0, 2), ['p3', 'p1']);
});

test('later specs break ties left by earlier ones', () => {
  eq(ids(sortBy(PRODUCTS, ['category', '-price'])), [
    'p4', 'p7', 'p5', 'p8', 'p3', 'p1', 'p2', 'p6',
  ]);
});

test('string fields sort case-insensitively', () => {
  const rows = [{ name: 'cherry' }, { name: 'Banana' }, { name: 'apple' }];
  eq(sortBy(rows, ['name']).map((r) => r.name), ['apple', 'Banana', 'cherry']);
});

test('items that tie on every spec keep their original order', () => {
  const rows = [
    { g: 'a', n: 1 },
    { g: 'b', n: 2 },
    { g: 'a', n: 3 },
  ];
  eq(sortBy(rows, ['g']).map((r) => r.n), [1, 3, 2]);
});

test('no specs means an unsorted copy', () => {
  const copy = sortBy(PRODUCTS, []);
  eq(ids(copy), ids(PRODUCTS));
  ok(copy !== PRODUCTS);
});

test('the frozen input is never sorted in place', () => {
  sortBy(PRODUCTS, ['-price']);
  eq(PRODUCTS[0].id, 'p1');
});

test('an empty list sorts to an empty list', () => {
  eq(sortBy([], ['price']), []);
});
