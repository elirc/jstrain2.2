// ─────────────────────────────────────────────────────────────────────────
//  09 · composable predicates — SOLUTION                    ★★☆ core
//  run: node 09-predicates.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: all three combinators are one line, because `every` and
//  `some` already ARE allPass and anyPass — they short-circuit for free
//  and they give the right answers for an empty list (every → true,
//  some → false).
//  buildFilter is where it pays off. Instead of one boolean expression
//  with four `&&` and four "is this criterion even set?" guards tangled
//  together, you build a LIST of checks and hand it to allPass. Adding a
//  new filter is one push, never an edit to existing logic.
//  Note `(...args)` rather than `(value)`: keeping the predicates variadic
//  means they still work for two-argument comparisons, and it costs
//  nothing.

import { test, eq, ok, spy } from '../../_lib/check.js';

const products = Object.freeze([
  { name: 'Travel Mug', price: 18, stock: 4, tags: ['kitchen', 'travel'] },
  { name: 'Desk Lamp', price: 45, stock: 0, tags: ['office'] },
  { name: 'Notebook', price: 8, stock: 12, tags: ['office', 'paper'] },
  { name: 'Mug Warmer', price: 25, stock: 2, tags: ['kitchen'] },
]);

const names = (list) => list.map((p) => p.name);

export function not(predicate) {
  return (...args) => !predicate(...args);
}

export function allPass(predicates) {
  return (...args) => predicates.every((predicate) => predicate(...args));
}

export function anyPass(predicates) {
  return (...args) => predicates.some((predicate) => predicate(...args));
}

export function buildFilter(criteria) {
  const checks = [];
  if (criteria.maxPrice !== undefined) {
    checks.push((p) => p.price <= criteria.maxPrice);
  }
  if (criteria.tag !== undefined) {
    checks.push((p) => p.tags.includes(criteria.tag));
  }
  if (criteria.inStock) {
    checks.push((p) => p.stock > 0);
  }
  if (criteria.query !== undefined) {
    const query = criteria.query.toLowerCase();
    checks.push((p) => p.name.toLowerCase().includes(query));
  }
  return allPass(checks);
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
