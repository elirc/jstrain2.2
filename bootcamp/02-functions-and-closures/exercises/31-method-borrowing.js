// ─────────────────────────────────────────────────────────────────────────
//  31 · borrowing methods with call and apply              ★★☆ core
//  concepts: this · call · apply · array-likes
//  run: node 31-method-borrowing.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `call` and `apply` let you run any method with any receiver, which is
//  how you use array methods on things that merely look like arrays
//  (`arguments`, a NodeList, `{0:'a', length:1}`) and how you read the
//  internal type tag of a value.
//
//      toArray({ 0: 'a', 1: 'b', length: 2 })  → ['a', 'b']
//      toArray('hi')                           → ['h', 'i']
//
//      typeTag([])        → 'Array'    (typeof says 'object')
//      typeTag(null)      → 'Null'     (typeof says 'object')
//      typeTag(new Date(0)) → 'Date'
//
//      maxOf([3, 9, 4])   → 9          Math.max takes numbers, not an array
//
//  Use the borrowed methods — `Array.prototype.slice`,
//  `Object.prototype.toString`, `Math.max` — not `Array.from`, not a
//  manual loop. `maxOf` is the `apply` rep: `fn.apply(receiver, argsArray)`
//  is the pre-spread way to write `fn(...argsArray)`.
//
//  hint: `Array.prototype.slice.call(x)` works because slice only reads
//  `this.length` and `this[i]` — it never checks that `this` is an array

import { test, eq, ok } from '../../_lib/check.js';

export function toArray(arrayLike) {
  throw new Error('TODO');
}

export function typeTag(value) {
  throw new Error('TODO');
}

export function maxOf(numbers) {
  throw new Error('TODO');
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
