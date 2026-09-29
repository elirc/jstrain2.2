// ─────────────────────────────────────────────────────────────────────────
//  17 · slice vs splice                                    ★★☆ core
//  concepts: slice · splice · immutable edits
//  run: node 17-slice-vs-splice.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `slice(start, end)` copies a window and leaves the source alone.
//  `splice(start, count, ...items)` edits the source in place and returns
//  the REMOVED items — two letters apart, opposite behaviour.
//
//      removeAt(['a', 'b', 'c'], 1)        → ['a', 'c']
//      insertAt(['a', 'c'], 1, 'b')        → ['a', 'b', 'c']
//      replaceAt(['a', 'b', 'c'], 2, 'z')  → ['a', 'b', 'z']
//
//  Every input in the tests is frozen: build new arrays, never edit the
//  one you were given.
//
//  hint: two slices and a spread —
//  `[...items.slice(0, i), ...items.slice(i + 1)]`

import { test, eq, ok } from '../../_lib/check.js';

const LETTERS = Object.freeze(['a', 'b', 'c', 'd']);

export function removeAt(items, index) {
  throw new Error('TODO');
}

export function insertAt(items, index, value) {
  throw new Error('TODO');
}

export function replaceAt(items, index, value) {
  throw new Error('TODO');
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
