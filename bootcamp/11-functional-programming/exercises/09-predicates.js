// ─────────────────────────────────────────────────────────────────────────
//  09 · composable predicates                               ★★☆ core
//  concepts: higher-order functions · predicates · search filters
//  run: node 09-predicates.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A predicate is any function that returns true or false. Combine them
//  and a product search stops being a wall of nested ifs.
//
//      not((n) => n % 2 === 0)          → a predicate for "odd"
//      allPass([isCheap, inStock])(p)   → true only if BOTH hold
//      anyPass([isMug, isLamp])(p)      → true if EITHER holds
//
//  Then buildFilter turns a criteria object into ONE predicate. Every key
//  is optional and each one that IS present adds a check:
//
//      maxPrice → price <= maxPrice        tag   → tags includes tag
//      inStock  → stock > 0 (only when true)
//      query    → name contains query, case-insensitively
//
//      products.filter(buildFilter({ maxPrice: 30, inStock: true }))
//      buildFilter({})                  → matches every product
//
//  hint: `every` on an empty array is true — that is not an accident, and
//  it is exactly what makes empty criteria match everything.

import { test, eq, ok, spy } from '../../_lib/check.js';

const products = Object.freeze([
  { name: 'Travel Mug', price: 18, stock: 4, tags: ['kitchen', 'travel'] },
  { name: 'Desk Lamp', price: 45, stock: 0, tags: ['office'] },
  { name: 'Notebook', price: 8, stock: 12, tags: ['office', 'paper'] },
  { name: 'Mug Warmer', price: 25, stock: 2, tags: ['kitchen'] },
]);

const names = (list) => list.map((p) => p.name);

export function not(predicate) {
  throw new Error('TODO');
}

export function allPass(predicates) {
  throw new Error('TODO');
}

export function anyPass(predicates) {
  throw new Error('TODO');
}

export function buildFilter(criteria) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('not flips the answer of a predicate', () => {
  const isOdd = not((n) => n % 2 === 0);
  eq(isOdd(3), true);
  eq(isOdd(4), false);
});

test('allPass demands every predicate, anyPass just one', () => {
  const big = (n) => n > 10;
  const even = (n) => n % 2 === 0;
  eq(allPass([big, even])(12), true);
  eq(allPass([big, even])(11), false);
  eq(anyPass([big, even])(11), true);
  eq(anyPass([big, even])(3), false);
});

test('an empty list passes allPass and fails anyPass', () => {
  eq(allPass([])('anything'), true);
  eq(anyPass([])('anything'), false);
});

test('allPass stops at the first predicate that fails', () => {
  const later = spy(() => true);
  eq(allPass([() => false, later])('x'), false);
  eq(later.callCount, 0);
});

test('predicates receive every argument they were called with', () => {
  const sameCity = (a, b) => a.city === b.city;
  eq(allPass([sameCity])({ city: 'Rome' }, { city: 'Rome' }), true);
});

test('buildFilter with no criteria keeps everything', () => {
  eq(products.filter(buildFilter({})).length, 4);
});

test('buildFilter combines price and stock', () => {
  const cheapAndAvailable = buildFilter({ maxPrice: 30, inStock: true });
  eq(names(products.filter(cheapAndAvailable)), [
    'Travel Mug',
    'Notebook',
    'Mug Warmer',
  ]);
});

test('buildFilter matches tags and is case-insensitive on query', () => {
  eq(names(products.filter(buildFilter({ tag: 'kitchen' }))), [
    'Travel Mug',
    'Mug Warmer',
  ]);
  eq(names(products.filter(buildFilter({ query: 'MUG' }))), [
    'Travel Mug',
    'Mug Warmer',
  ]);
  ok(products.filter(buildFilter({ query: 'zzz' })).length === 0);
});
