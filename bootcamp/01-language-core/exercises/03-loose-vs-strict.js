// ─────────────────────────────────────────────────────────────────────────
//  03 · looseVsStrict                                       ★☆☆ warm-up
//  concepts: == coercion · === identity · null vs undefined
//  run: node 03-loose-vs-strict.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `==` converts before it compares; `===` refuses to convert. Report both
//  so you can see the difference, then write the ONE comparison where `==`
//  is the right tool: catching null and undefined together.
//
//      equalityReport(0, '')            → { loose: true,  strict: false }
//      equalityReport(null, undefined)  → { loose: true,  strict: false }
//      equalityReport(NaN, NaN)         → { loose: false, strict: false }
//      equalityReport(1, 1)             → { loose: true,  strict: true }
//
//      isNullish(null)  → true      isNullish(0)   → false
//      isNullish(0)     → false     isNullish('')  → false

import { test, eq } from '../../_lib/check.js';

export function equalityReport(a, b) {
  throw new Error('TODO');
}

export function isNullish(value) {
  throw new Error('TODO');
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
