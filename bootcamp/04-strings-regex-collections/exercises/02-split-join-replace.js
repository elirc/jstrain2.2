// ─────────────────────────────────────────────────────────────────────────
//  02 · split, join, replace                                ★☆☆ warm-up
//  concepts: split · join · trim · replaceAll
//  run: node 02-split-join-replace.js
// ─────────────────────────────────────────────────────────────────────────
//
//  split() cuts a string into an array, join() glues an array back into a
//  string. Together they are the cheapest transform in JavaScript.
//
//      splitFields(' name , email ,age')  → ['name', 'email', 'age']
//      joinPath(['usr', 'local', 'bin'])  → 'usr/local/bin'
//      swapSeparator('a-b-c', '-', '_')   → 'a_b_c'
//      squish('  the   quick  brown ')    → 'the quick brown'
//
//  replace() swaps only the FIRST match; replaceAll() swaps every one.
//  squish: trim the ends, then collapse every run of whitespace to one
//  space (split(/\s+/) treats a run of spaces/tabs/newlines as one cut).

import { test, eq } from '../../_lib/check.js';

export function splitFields(row) {
  throw new Error('TODO');
}

export function joinPath(parts) {
  throw new Error('TODO');
}

export function swapSeparator(text, from, to) {
  throw new Error('TODO');
}

export function squish(text) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('splitFields splits on commas', () => {
  eq(splitFields('a,b,c'), ['a', 'b', 'c']);
});

test('splitFields trims the spaces around each field', () => {
  eq(splitFields(' name , email ,age'), ['name', 'email', 'age']);
});

test('splitFields on a single field gives a one-item array', () => {
  eq(splitFields('solo'), ['solo']);
});

test('joinPath glues the parts with slashes', () => {
  eq(joinPath(['usr', 'local', 'bin']), 'usr/local/bin');
});

test('joinPath of one part adds no slash', () => {
  eq(joinPath(['tmp']), 'tmp');
});

test('swapSeparator replaces EVERY occurrence, not just the first', () => {
  eq(swapSeparator('a-b-c', '-', '_'), 'a_b_c');
});

test('squish collapses runs of whitespace and trims the ends', () => {
  eq(squish('  the   quick \t brown '), 'the quick brown');
});

test('squish leaves an already clean string alone', () => {
  eq(squish('one two'), 'one two');
});
