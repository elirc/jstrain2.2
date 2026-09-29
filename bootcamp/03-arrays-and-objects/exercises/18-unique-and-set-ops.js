// ─────────────────────────────────────────────────────────────────────────
//  18 · unique · uniqueBy · set ops                        ★★☆ core
//  concepts: Set · dedupe · intersection · difference
//  run: node 18-unique-and-set-ops.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Four helpers you will otherwise reach for lodash to get. All of them
//  lean on `Set`, whose lookups are O(1) instead of the O(n) you get from
//  `includes` inside a loop.
//
//      unique([1, 2, 2, 3, 1])            → [1, 2, 3]
//      uniqueBy(ROWS, (r) => r.team)      → the first row of each team
//      intersection([1, 2, 2, 3], [2, 3]) → [2, 3]
//      difference([1, 2, 2, 3], [2])      → [1, 3]
//
//  All four return values in first-seen order, with duplicates collapsed,
//  and none of them mutates its inputs.
//
//  hint: `new Set(list)` builds the lookup once; `[...set]` turns it back
//  into an array in insertion order.

import { test, eq, ok } from '../../_lib/check.js';

const ROWS = Object.freeze([
  { id: 1, team: 'red' },
  { id: 2, team: 'blue' },
  { id: 3, team: 'red' },
  { id: 4, team: 'green' },
]);

export function unique(items) {
  throw new Error('TODO');
}

export function uniqueBy(items, keyFn) {
  throw new Error('TODO');
}

export function intersection(a, b) {
  throw new Error('TODO');
}

export function difference(a, b) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('unique keeps the first occurrence, in order', () => {
  eq(unique([1, 2, 2, 3, 1]), [1, 2, 3]);
});

test('unique works on strings and on empty lists', () => {
  eq(unique(['b', 'a', 'b']), ['b', 'a']);
  eq(unique([]), []);
});

test('unique collapses NaN, which indexOf never could', () => {
  eq(unique([NaN, 1, NaN]), [NaN, 1]);
});

test('uniqueBy keeps the first row of each key', () => {
  eq(uniqueBy(ROWS, (r) => r.team).map((r) => r.id), [1, 2, 4]);
});

test('uniqueBy returns the original objects', () => {
  ok(uniqueBy(ROWS, (r) => r.team)[0] === ROWS[0]);
});

test('intersection keeps what both lists have', () => {
  eq(intersection([1, 2, 2, 3], [2, 3, 9]), [2, 3]);
  eq(intersection([1], [2]), []);
});

test('difference removes everything the second list contains', () => {
  eq(difference([1, 2, 2, 3], [2]), [1, 3]);
  eq(difference([], [1]), []);
});

test('neither operation mutates its inputs', () => {
  const a = Object.freeze([1, 2, 3]);
  const b = Object.freeze([2]);
  eq(difference(a, b), [1, 3]);
  eq(a, [1, 2, 3]);
  eq(b, [2]);
});
