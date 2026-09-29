// ─────────────────────────────────────────────────────────────────────────
//  03 · looseVsStrict — SOLUTION                            ★☆☆ warm-up
//  run: node 03-loose-vs-strict.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the report itself is one line — the lesson is in the
//  tests. `==` runs an algorithm: null and undefined are equal to each
//  other and nothing else; a string compared to a number becomes a
//  number; an object compared to a primitive is unwrapped first, which is
//  why [] == '' is true ([] stringifies to '').
//
//  `value == null` is the single idiom worth keeping: it is true for null
//  and undefined and false for every other value, including 0 and ''.

import { test, eq } from '../../_lib/check.js';

export function equalityReport(a, b) {
  return { loose: a == b, strict: a === b };
}

export function isNullish(value) {
  return value == null;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('0 == "" but 0 !== ""', () => {
  eq(equalityReport(0, ''), { loose: true, strict: false });
});

test('null is loosely equal to undefined and to nothing else', () => {
  eq(equalityReport(null, undefined), { loose: true, strict: false });
  eq(equalityReport(null, 0), { loose: false, strict: false });
  eq(equalityReport(undefined, false), { loose: false, strict: false });
});

test('NaN is not equal to itself under either operator', () => {
  eq(equalityReport(NaN, NaN), { loose: false, strict: false });
});

test('strings coerce to numbers before comparing', () => {
  eq(equalityReport('1', 1), { loose: true, strict: false });
  eq(equalityReport('0', false), { loose: true, strict: false });
  eq(equalityReport('abc', 0), { loose: false, strict: false });
});

test('objects compare by identity, but [] flattens to "" first', () => {
  const same = { id: 1 };
  eq(equalityReport(same, same), { loose: true, strict: true });
  eq(equalityReport({ id: 1 }, { id: 1 }), { loose: false, strict: false });
  eq(equalityReport([], ''), { loose: true, strict: false });
});

test('isNullish is true for exactly two values', () => {
  eq(isNullish(null), true);
  eq(isNullish(undefined), true);
  eq(isNullish(0), false);
  eq(isNullish(''), false);
  eq(isNullish(false), false);
  eq(isNullish(NaN), false);
});
