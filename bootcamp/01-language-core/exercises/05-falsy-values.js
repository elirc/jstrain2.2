// ─────────────────────────────────────────────────────────────────────────
//  05 · countTruthy                                         ★☆☆ warm-up
//  concepts: truthiness · the eight falsy values
//  run: node 05-falsy-values.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Exactly eight values are falsy in JavaScript:
//
//      false   0   -0   0n   ''   null   undefined   NaN
//
//  Everything else is truthy — including '0', 'false', [] and {}.
//  Write two helpers that lean on that rule.
//
//      countTruthy([0, '', 'ok'])         → 1
//      countTruthy(['0', [], {}])         → 3
//      firstTruthy([0, '', 'ok', 'late']) → 'ok'
//      firstTruthy([0, ''])               → undefined

import { test, eq } from '../../_lib/check.js';

export function countTruthy(values) {
  throw new Error('TODO');
}

export function firstTruthy(values) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('counts nothing in the eight falsy values', () => {
  eq(countTruthy([false, 0, -0, 0n, '', null, undefined, NaN]), 0);
});

test('counts the sneaky truthy ones', () => {
  eq(countTruthy(['0', 'false', [], {}, ' ', -1, Infinity]), 7);
});

test('counts a mixed list', () => {
  eq(countTruthy([1, null, 'x', 0, [], '']), 3);
});

test('an empty list has nothing truthy', () => {
  eq(countTruthy([]), 0);
  eq(firstTruthy([]), undefined);
});

test('firstTruthy skips the falsy prefix', () => {
  eq(firstTruthy([0, '', null, 'found', 'later']), 'found');
  eq(firstTruthy([NaN, 42]), 42);
});

test('firstTruthy can return an empty array, which is truthy', () => {
  eq(firstTruthy([0, [], 'x']), []);
});

test('firstTruthy returns undefined when everything is falsy', () => {
  eq(firstTruthy([0, '', null, undefined, NaN]), undefined);
});
