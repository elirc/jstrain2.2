// ─────────────────────────────────────────────────────────────────────────
//  31 · borrowing methods with call and apply — SOLUTION   ★★☆ core
//  run: node 31-method-borrowing.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: array methods are written against a `this` with a `length`
//  and numeric keys, so borrowing one with `.call` works on any object
//  shaped like that — `slice` is the classic "copy an array-like into a
//  real array". `Object.prototype.toString.call(v)` reaches the internal
//  tag that `typeof` hides, which is why it is the old-school way to tell
//  `null` and `[]` apart from a plain object.
//  `apply` is the same call with the arguments handed over as an array,
//  which is what `Math.max` needs. Today `Math.max(...numbers)` says it
//  more clearly and both do the same thing — but spread and apply share a
//  limit: a huge array can blow the argument-count limit, so summarise a
//  million-element array with a reduce instead.
//  Note `maxOf([])` is `-Infinity`, the identity element for max — not an
//  error, and a good reminder to check for empty input yourself.

import { test, eq, ok } from '../../_lib/check.js';

export function toArray(arrayLike) {
  return Array.prototype.slice.call(arrayLike);
}

export function typeTag(value) {
  return Object.prototype.toString.call(value).slice(8, -1);
}

export function maxOf(numbers) {
  return Math.max.apply(null, numbers);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('toArray copies an array-like object into a real array', () => {
  eq(toArray({ 0: 'a', 1: 'b', length: 2 }), ['a', 'b']);
});

test('toArray works on the arguments object', () => {
  function collect() {
    return toArray(arguments);
  }
  eq(collect(1, 2, 3), [1, 2, 3]);
});

test('toArray splits a string into characters', () => {
  eq(toArray('hi'), ['h', 'i']);
});

test('the result is a genuine array, not another array-like', () => {
  const list = toArray({ 0: 'a', length: 1 });
  ok(Array.isArray(list));
  eq(list.map((s) => s.toUpperCase()), ['A']);
  eq(toArray({ length: 0 }), []);
});

test('typeTag reads the tag that typeof hides', () => {
  eq(typeTag([]), 'Array');
  eq(typeTag(null), 'Null');
  eq(typeTag(new Date(0)), 'Date');
});

test('typeTag still reports the ordinary types', () => {
  eq(typeTag({}), 'Object');
  eq(typeTag(3), 'Number');
  eq(typeTag(undefined), 'Undefined');
});

test('maxOf hands a whole array to Math.max', () => {
  eq(maxOf([3, 9, 4]), 9);
  eq(maxOf([-5]), -5);
});

test('maxOf of an empty array is -Infinity, the identity for max', () => {
  eq(maxOf([]), -Infinity);
  const numbers = [1, 2];
  maxOf(numbers);
  eq(numbers, [1, 2], 'the input must not be consumed');
});
