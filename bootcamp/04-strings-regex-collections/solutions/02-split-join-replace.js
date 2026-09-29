// ─────────────────────────────────────────────────────────────────────────
//  02 · split, join, replace — SOLUTION                     ★☆☆ warm-up
//  run: node 02-split-join-replace.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: split → map → join is the string pipeline. splitFields
//  trims INSIDE the map so ' name ' becomes 'name' without a second pass.
//  swapSeparator has to use replaceAll: replace() with a string pattern
//  swaps only the first hit, which is the bug people ship. (replace with
//  a /g regex is the old spelling of the same thing.)
//  squish trims first — otherwise a leading space would produce an empty
//  first word — then splits on /\s+/, which treats a whole run of spaces,
//  tabs and newlines as ONE separator, and rejoins with single spaces.

import { test, eq } from '../../_lib/check.js';

export function splitFields(row) {
  return row.split(',').map((field) => field.trim());
}

export function joinPath(parts) {
  return parts.join('/');
}

export function swapSeparator(text, from, to) {
  return text.replaceAll(from, to);
}

export function squish(text) {
  return text.trim().split(/\s+/).join(' ');
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
