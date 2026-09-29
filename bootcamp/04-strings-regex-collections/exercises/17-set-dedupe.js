// ─────────────────────────────────────────────────────────────────────────
//  17 · Set: dedupe and detect                              ★☆☆ warm-up
//  concepts: Set · has/add · order preservation
//  run: node 17-set-dedupe.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A Set is a bag of unique values with O(1) `has`. Two classic uses:
//  removing duplicates, and remembering what you have already seen while
//  looping.
//
//      unique([3, 1, 3, 2, 1])         → [3, 1, 2]   (first-seen order)
//      unique([1, '1'])                → [1, '1']    (no type coercion)
//      hasDuplicates([1, 2, 2])        → true
//      firstDuplicate(['a','b','c','b','a'])  → 'b'
//      firstDuplicate(['a', 'b'])      → null
//
//  firstDuplicate returns the first value that appears for the SECOND
//  time as you scan left to right — 'b' above, because b repeats before
//  a does. An array's indexOf would work but is O(n²); use a Set.

import { test, eq } from '../../_lib/check.js';

export function unique(items) {
  throw new Error('TODO');
}

export function hasDuplicates(items) {
  throw new Error('TODO');
}

export function firstDuplicate(items) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('unique removes repeats and keeps first-seen order', () => {
  eq(unique([3, 1, 3, 2, 1]), [3, 1, 2]);
});

test('unique returns an array, not a Set', () => {
  eq(Array.isArray(unique(['a'])), true);
});

test('unique does not coerce types', () => {
  eq(unique([1, '1']), [1, '1']);
});

test('unique leaves a clean array alone', () => {
  eq(unique(['x', 'y']), ['x', 'y']);
  eq(unique([]), []);
});

test('hasDuplicates spots a repeat', () => {
  eq(hasDuplicates([1, 2, 2]), true);
  eq(hasDuplicates(['a', 'b', 'a']), true);
});

test('hasDuplicates is false for a clean list', () => {
  eq(hasDuplicates([1, 2, 3]), false);
  eq(hasDuplicates([]), false);
});

test('firstDuplicate returns the value that repeats first', () => {
  eq(firstDuplicate(['a', 'b', 'c', 'b', 'a']), 'b');
});

test('firstDuplicate returns null when everything is unique', () => {
  eq(firstDuplicate(['a', 'b']), null);
});
