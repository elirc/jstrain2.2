// ─────────────────────────────────────────────────────────────────────────
//  02 · reverseInPlace / rotateRight — SOLUTION             ★★☆ core
//  concepts: pattern: two pointers (in-place swap) · three-reversal trick
//  run: node 02-reverse-and-rotate.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: two pointers, converging, swapping as they go.
//  reverseInPlace walks `left` up and `right` down, swapping until they
//  meet: O(n) time, O(1) space, exactly n/2 swaps.
//  rotateRight is the famous three-reversal trick: reverse everything,
//  then reverse the first k, then reverse the remaining n-k. The tail is
//  now at the front, in its original order. Still O(n) / O(1).
//  The naive rotate is "shift every element one slot, k times" — O(n·k),
//  which explodes when k is large. Copying into a new array is O(n) time
//  but O(n) extra space; interviewers ask for the in-place version.
//  Two bites: normalise k with `k % n` FIRST (k can exceed n), and guard
//  n === 0 because `k % 0` is NaN and every index goes undefined.

import { test, eq, ok } from '../../_lib/check.js';

function reverseRange(arr, from, to) {
  let left = from;
  let right = to;
  while (left < right) {
    [arr[left], arr[right]] = [arr[right], arr[left]];
    left += 1;
    right -= 1;
  }
}

export function reverseInPlace(arr) {
  reverseRange(arr, 0, arr.length - 1);
  return arr;
}

export function rotateRight(arr, k) {
  const n = arr.length;
  if (n === 0) return arr;
  const shift = ((k % n) + n) % n;
  reverseRange(arr, 0, n - 1);
  reverseRange(arr, 0, shift - 1);
  reverseRange(arr, shift, n - 1);
  return arr;
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
