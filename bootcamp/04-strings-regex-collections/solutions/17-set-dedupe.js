// ─────────────────────────────────────────────────────────────────────────
//  17 · Set: dedupe and detect — SOLUTION                   ★☆☆ warm-up
//  run: node 17-set-dedupe.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: [...new Set(items)] is the canonical dedupe. A Set keeps
//  insertion order and compares with SameValueZero — no coercion, so 1
//  and '1' both survive, unlike a key-on-an-object approach.
//  hasDuplicates compares sizes: if collapsing the list shrank it, some
//  value repeated.
//  firstDuplicate needs the loop, because it has to stop at the FIRST
//  value seen twice: check has() before add(). Doing it with
//  items.indexOf(item) !== i inside a filter is O(n²) and, worse, returns
//  the wrong element when a later value repeats sooner.

import { test, eq } from '../../_lib/check.js';

export function unique(items) {
  return [...new Set(items)];
}

export function hasDuplicates(items) {
  return new Set(items).size !== items.length;
}

export function firstDuplicate(items) {
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item)) return item;
    seen.add(item);
  }
  return null;
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
