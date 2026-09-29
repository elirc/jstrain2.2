// ─────────────────────────────────────────────────────────────────────────
//  16 · Proxy traps                                          ★★★ stretch
//  concepts: Proxy · Reflect · interception
//  run: node exercises/16-proxy-guards.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A Proxy wraps an object and lets you intercept the basic operations —
//  reads (`get`) and writes (`set`) here. Build three useful ones.
//
//  1. validated(target, rules) — rules is { field: (value) => boolean }
//         const rules = { name: (v) => v.length > 0,
//                         age:  (v) => Number.isInteger(v) && v >= 0 };
//         const user = validated({ name: 'Ada', age: 36 }, rules);
//         user.age = 37            → fine
//         user.age = -1            → throws 'invalid age'
//         user.nmae = 'typo'       → throws 'unknown property: nmae'
//
//  2. withDefault(target, fallback) — reads of missing keys return the
//     fallback. A key that exists must win even when its value is falsy:
//         const counts = withDefault({ a: 0 }, 99);
//         counts.a  → 0        counts.zzz → 99
//
//  3. negativeIndex(array) — Python-style indexing from the end, with
//     everything else (length, push, map, positive indexes) untouched:
//         const a = negativeIndex(['x', 'y', 'z']);
//         a[-1] → 'z'      a[0] → 'x'      a.length → 3
//
//  hint: property keys arrive as strings, so `-1` is the string '-1';
//  and `Reflect.get/set/has(target, key)` is the "do what would normally
//  have happened" escape hatch

import { test, eq, ok, throws } from '../../_lib/check.js';

export function validated(target, rules) {
  throw new Error('TODO');
}

export function withDefault(target, fallback) {
  throw new Error('TODO');
}

export function negativeIndex(array) {
  throw new Error('TODO');
}

const RULES = {
  name: (v) => typeof v === 'string' && v.length > 0,
  age: (v) => Number.isInteger(v) && v >= 0,
};

// ──────────────────────────── tests ──────────────────────────────────────

test('valid writes and reads pass straight through', () => {
  const user = validated({ name: 'Ada', age: 36 }, RULES);
  user.age = 37;
  eq(user.age, 37);
  eq(user.name, 'Ada');
  eq({ ...user }, { name: 'Ada', age: 37 });
});

test('a value that fails its rule is rejected, and nothing changes', () => {
  const raw = { name: 'Ada', age: 36 };
  const user = validated(raw, RULES);
  throws(() => {
    user.age = -1;
  }, 'invalid age');
  eq(user.age, 36);
  eq(raw.age, 36);
});

test('an unknown property is rejected by name', () => {
  const user = validated({ name: 'Ada', age: 36 }, RULES);
  throws(() => {
    user.nmae = 'typo';
  }, 'unknown property: nmae');
});

test('withDefault fills in only what is missing', () => {
  const counts = withDefault({ a: 1 }, 0);
  eq(counts.a, 1);
  eq(counts.zzz, 0);
  counts.b = 5;
  eq(counts.b, 5);
});

test('withDefault does not confuse missing with falsy', () => {
  const counts = withDefault({ a: 0, b: '', c: null }, 99);
  eq(counts.a, 0);
  eq(counts.b, '');
  eq(counts.c, null);
  eq(counts.d, 99);
});

test('negativeIndex counts back from the end', () => {
  const letters = negativeIndex(['x', 'y', 'z']);
  eq(letters[-1], 'z');
  eq(letters[-3], 'x');
  eq(letters[-4], undefined);
});

test('negativeIndex leaves the array otherwise intact', () => {
  const letters = negativeIndex(['x', 'y', 'z']);
  eq(letters[0], 'x');
  eq(letters.length, 3);
  letters.push('w');
  eq(letters.length, 4);
  eq(letters[-1], 'w');
  eq(letters.map((c) => c.toUpperCase()), ['X', 'Y', 'Z', 'W']);
  ok(Array.isArray(letters));
});
