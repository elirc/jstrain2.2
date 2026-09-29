// ─────────────────────────────────────────────────────────────────────────
//  01 · typeOf                                              ★☆☆ warm-up
//  concepts: typeof · null · arrays · NaN
//  run: node 01-type-of.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `typeof` lies three times: it calls null an "object", it calls arrays
//  an "object", and it calls NaN a "number". Build the version you wish
//  the language shipped with — a lowercase tag you can actually branch on.
//
//      typeOf(null)      → 'null'
//      typeOf([1, 2])    → 'array'
//      typeOf(NaN)       → 'nan'
//      typeOf(42)        → 'number'
//      typeOf(() => {})  → 'function'
//      typeOf({})        → 'object'

import { test, eq } from '../../_lib/check.js';

export function typeOf(value) {
  throw new Error('TODO');
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
