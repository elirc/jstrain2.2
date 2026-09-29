// ─────────────────────────────────────────────────────────────────────────
//  17 · slice vs splice — SOLUTION                         ★★☆ core
//  run: node 17-slice-vs-splice.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the immutable edit is always "copy the part before, add or
//  skip, copy the part after". `slice` never mutates and clamps
//  out-of-range indexes to the ends, so `removeAt(items, 99)` degrades to
//  a plain copy instead of throwing. `splice` would have been shorter, but
//  it edits in place — on a frozen array that throws, and on a shared array
//  it silently changes data other code is holding. The modern copying
//  equivalents are `toSpliced(i, 1)` and `with(i, value)`; `with` is what
//  `replaceAt` uses here, and it DOES throw on an out-of-range index.

import { test, eq, ok } from '../../_lib/check.js';

const LETTERS = Object.freeze(['a', 'b', 'c', 'd']);

export function removeAt(items, index) {
  return [...items.slice(0, index), ...items.slice(index + 1)];
}

export function insertAt(items, index, value) {
  return [...items.slice(0, index), value, ...items.slice(index)];
}

export function replaceAt(items, index, value) {
  return items.with(index, value);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('removeAt drops the element at that index', () => {
  eq(removeAt(LETTERS, 1), ['a', 'c', 'd']);
});

test('removeAt leaves the frozen original intact', () => {
  const result = removeAt(LETTERS, 0);
  eq(result, ['b', 'c', 'd']);
  eq(LETTERS, ['a', 'b', 'c', 'd']);
  ok(result !== LETTERS);
});

test('removeAt with an index past the end is just a copy', () => {
  eq(removeAt(LETTERS, 99), ['a', 'b', 'c', 'd']);
});

test('insertAt puts the value before the given index', () => {
  eq(insertAt(['a', 'c'], 1, 'b'), ['a', 'b', 'c']);
});

test('insertAt at 0 prepends and at length appends', () => {
  eq(insertAt(LETTERS, 0, 'z'), ['z', 'a', 'b', 'c', 'd']);
  eq(insertAt(LETTERS, 4, 'z'), ['a', 'b', 'c', 'd', 'z']);
});

test('replaceAt swaps a single slot', () => {
  eq(replaceAt(LETTERS, 2, 'z'), ['a', 'b', 'z', 'd']);
});

test('replaceAt does not touch the original', () => {
  replaceAt(LETTERS, 0, 'z');
  eq(LETTERS[0], 'a');
});
