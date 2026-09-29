// ─────────────────────────────────────────────────────────────────────────
//  23 · deepCopy                                             ★★★ stretch
//  concepts: recursion · structuredClone · what a copy cannot carry
//  run: node 23-deep-copy.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Spread stops at one level and JSON.parse(JSON.stringify(x)) destroys
//  Dates, Maps, Sets and undefined. Write a real one — recursively, by
//  hand, WITHOUT structuredClone:
//
//      deepCopy({ a: { b: [1, 2] } })   → equal, but every level new
//      deepCopy(new Date(0))            → a new Date with the same time
//      deepCopy(new Map([['k', {}]]))   → a new Map with a new inner {}
//      deepCopy(5)                      → 5      (primitives pass through)
//      deepCopy(fn)                     → fn     (same function, by ref)
//
//  Then safeCopy, which uses the built-in structuredClone and returns
//  null when the value cannot be cloned at all:
//
//      safeCopy({ n: 1 })          → { n: 1 }   (a new object)
//      safeCopy({ run: () => {} }) → null       (functions cannot clone)
//
//  hint: one type check per branch — primitives, Date, Map, Set, Array,
//  plain object — and recurse into the parts. Object.entries plus
//  Object.fromEntries makes the last branch short.

import { test, eq, ok } from '../../_lib/check.js';

export function deepCopy(value) {
  throw new Error('TODO');
}

export function safeCopy(value) {
  throw new Error('TODO');
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
