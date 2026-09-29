// ─────────────────────────────────────────────────────────────────────────
//  01 · typeOf — SOLUTION                                   ★☆☆ warm-up
//  run: node 01-type-of.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: handle the three liars first, in order, then fall back to
//  `typeof`. null must be checked with `===` because `typeof null` is
//  'object' and nothing else distinguishes it. Arrays need Array.isArray
//  (an instanceof check breaks across realms). NaN is the only value that
//  is not equal to itself — Number.isNaN says so without coercing, unlike
//  the global isNaN, which claims isNaN('abc') is true.

import { test, eq } from '../../_lib/check.js';

export function typeOf(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'number' && Number.isNaN(value)) return 'nan';
  return typeof value;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('tags null as "null", not "object"', () => {
  eq(typeOf(null), 'null');
  eq(typeof null, 'object'); // the lie you are fixing
});

test('tags arrays as "array"', () => {
  eq(typeOf([]), 'array');
  eq(typeOf([1, 2, 3]), 'array');
});

test('tags NaN as "nan" but keeps real numbers as "number"', () => {
  eq(typeOf(NaN), 'nan');
  eq(typeOf(0), 'number');
  eq(typeOf(Infinity), 'number');
});

test('passes through the honest typeof answers', () => {
  eq(typeOf('hi'), 'string');
  eq(typeOf(true), 'boolean');
  eq(typeOf(undefined), 'undefined');
  eq(typeOf(() => {}), 'function');
});

test('still says "object" for plain objects and dates', () => {
  eq(typeOf({}), 'object');
  eq(typeOf(new Date()), 'object');
});

test('knows symbols and bigints', () => {
  eq(typeOf(Symbol('id')), 'symbol');
  eq(typeOf(10n), 'bigint');
});
