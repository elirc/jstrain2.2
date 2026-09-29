// ─────────────────────────────────────────────────────────────────────────
//  02 · reverseInPlace / rotateRight                        ★★☆ core
//  concepts: pattern: two pointers (in-place swap) · three-reversal trick
//  run: node 02-reverse-and-rotate.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Two in-place array jobs. Both MUTATE the array they are given and
//  return that same array — no `.slice()`, no `.reverse()`, no new array.
//
//      reverseInPlace([1, 2, 3, 4])   → [4, 3, 2, 1]
//      rotateRight([1, 2, 3, 4, 5], 2) → [4, 5, 1, 2, 3]
//      rotateRight([1, 2, 3], 5)       → [2, 3, 1]   (5 wraps to 2)
//
//  rotateRight(arr, k) slides every element k slots to the right; what
//  falls off the end reappears at the front. k can be 0 or bigger than
//  the array.
//
//  hint: reverse the whole array, then reverse the first k, then reverse
//  the rest — write a helper that reverses a [from, to] range

import { test, eq, ok } from '../../_lib/check.js';

export function reverseInPlace(arr) {
  throw new Error('TODO');
}

export function rotateRight(arr, k) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('reverseInPlace flips an even-length array', () => {
  eq(reverseInPlace([1, 2, 3, 4]), [4, 3, 2, 1]);
});

test('reverseInPlace flips an odd-length array', () => {
  eq(reverseInPlace(['a', 'b', 'c']), ['c', 'b', 'a']);
});

test('reverseInPlace mutates the array it was handed', () => {
  const arr = [1, 2, 3];
  const out = reverseInPlace(arr);
  ok(out === arr, 'should return the same array reference');
  eq(arr, [3, 2, 1]);
});

test('reverseInPlace copes with empty and single-element arrays', () => {
  eq(reverseInPlace([]), []);
  eq(reverseInPlace([7]), [7]);
});

test('rotateRight moves the tail to the front', () => {
  eq(rotateRight([1, 2, 3, 4, 5], 2), [4, 5, 1, 2, 3]);
});

test('rotateRight wraps when k is bigger than the array', () => {
  eq(rotateRight([1, 2, 3], 5), [2, 3, 1]);
});

test('rotateRight with k = 0 changes nothing', () => {
  eq(rotateRight([1, 2, 3], 0), [1, 2, 3]);
});

test('rotateRight works in place and survives an empty array', () => {
  const arr = [1, 2, 3, 4];
  ok(rotateRight(arr, 1) === arr, 'should return the same array reference');
  eq(arr, [4, 1, 2, 3]);
  eq(rotateRight([], 3), []);
});
