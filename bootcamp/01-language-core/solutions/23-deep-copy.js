// ─────────────────────────────────────────────────────────────────────────
//  23 · deepCopy — SOLUTION                                  ★★★ stretch
//  run: node 23-deep-copy.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the first line does most of the work — primitives (and
//  functions) are returned as they are, because there is nothing to copy.
//  `value === null` has to be handled explicitly, since typeof null is
//  'object' and it would fall into the object branch and crash.
//
//  After that it is one branch per container type, each rebuilding the
//  container and recursing into the parts. Order matters: Array.isArray
//  must come before the generic object branch, and Date/Map/Set before
//  both, since they are all typeof 'object'.
//
//  safeCopy shows the built-in: structuredClone handles cycles, Dates,
//  Maps, Sets and typed arrays, but throws a DataCloneError on functions
//  (and on class instances it silently drops the prototype). try/catch
//  turns that into a null you can branch on.

import { test, eq, ok } from '../../_lib/check.js';

export function deepCopy(value) {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return new Date(value.getTime());
  if (value instanceof Map) {
    return new Map([...value].map(([k, v]) => [deepCopy(k), deepCopy(v)]));
  }
  if (value instanceof Set) {
    return new Set([...value].map((v) => deepCopy(v)));
  }
  if (Array.isArray(value)) return value.map((item) => deepCopy(item));
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [k, deepCopy(v)])
  );
}

export function safeCopy(value) {
  try {
    return structuredClone(value);
  } catch {
    return null;
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('copies nested objects and arrays by value', () => {
  const source = { a: { b: [1, { c: 2 }] }, d: 'x' };
  const copy = deepCopy(source);
  eq(copy, source);
  copy.a.b[1].c = 99;
  eq(source.a.b[1].c, 2, 'the source must be untouched');
});

test('no nested reference is shared', () => {
  const source = { a: { b: [1] } };
  const copy = deepCopy(source);
  ok(copy !== source, 'top level');
  ok(copy.a !== source.a, 'nested object');
  ok(copy.a.b !== source.a.b, 'nested array');
});

test('a Date comes back as a real, separate Date', () => {
  const when = new Date(86400000);
  const copy = deepCopy(when);
  ok(copy instanceof Date, 'still a Date');
  ok(copy !== when, 'a different instance');
  eq(copy.getTime(), 86400000);
});

test('Maps and Sets survive, contents and all', () => {
  const source = { m: new Map([['k', { n: 1 }]]), s: new Set([1, 2]) };
  const copy = deepCopy(source);
  eq(copy, source);
  ok(copy.m !== source.m, 'a new Map');
  ok(copy.m.get('k') !== source.m.get('k'), 'a new value inside the Map');
  ok(copy.s.has(2), 'the Set keeps its members');
});

test('primitives pass straight through', () => {
  eq(deepCopy(5), 5);
  eq(deepCopy('x'), 'x');
  eq(deepCopy(null), null);
  eq(deepCopy(undefined), undefined);
});

test('functions are kept by reference — they cannot be copied', () => {
  const run = () => 'ran';
  eq(deepCopy({ run }).run, run);
});

test('safeCopy clones plain data into a new object', () => {
  const source = { n: 1, list: [1, 2] };
  const copy = safeCopy(source);
  eq(copy, source);
  ok(copy !== source && copy.list !== source.list);
});

test('safeCopy returns null when the value contains a function', () => {
  eq(safeCopy({ run: () => {} }), null);
  eq(safeCopy(() => {}), null);
});
