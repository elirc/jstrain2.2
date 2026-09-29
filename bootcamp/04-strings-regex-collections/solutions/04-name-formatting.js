// ─────────────────────────────────────────────────────────────────────────
//  04 · name formatting — SOLUTION                          ★☆☆ warm-up
//  run: node 04-name-formatting.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: capitalize is charAt(0) + the rest lower-cased. Using
//  word[0] instead of charAt(0) throws on '' (undefined.toUpperCase),
//  which is the wrong turn here — charAt returns '' and slice(1) returns
//  '', so the empty case falls out for free.
//  titleCase is just capitalize mapped over the words.
//  initials trims first and splits on /\s+/ so a double space cannot
//  produce an empty "word" (and therefore an undefined initial). Splitting
//  on the literal ' ' is exactly the bug the whitespace test catches.

import { test, eq } from '../../_lib/check.js';

export function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function titleCase(text) {
  return text.split(' ').map(capitalize).join(' ');
}

export function initials(fullName) {
  return fullName
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('capitalize upper-cases the first letter', () => {
  eq(capitalize('ada'), 'Ada');
});

test('capitalize lower-cases the rest', () => {
  eq(capitalize('mARY'), 'Mary');
});

test('capitalize survives the empty string', () => {
  eq(capitalize(''), '');
});

test('titleCase capitalizes every word', () => {
  eq(titleCase('the great escape'), 'The Great Escape');
});

test('titleCase calms shouty input down', () => {
  eq(titleCase('THE GREAT ESCAPE'), 'The Great Escape');
});

test('initials take the first letter of each word', () => {
  eq(initials('ada lovelace'), 'AL');
  eq(initials('Grace Brewster Murray Hopper'), 'GBMH');
});

test('initials ignore extra whitespace', () => {
  eq(initials('  grace   hopper '), 'GH');
});

test('initials of a single name is a single letter', () => {
  eq(initials('cher'), 'C');
});
