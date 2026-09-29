// ─────────────────────────────────────────────────────────────────────────
//  04 · name formatting                                     ★☆☆ warm-up
//  concepts: toUpperCase · toLowerCase · split · map · join
//  run: node 04-name-formatting.js
// ─────────────────────────────────────────────────────────────────────────
//
//  User input is shouty, sloppy, and inconsistently spaced. Normalize it.
//
//      capitalize('mARY')                → 'Mary'
//      capitalize('')                    → ''
//      titleCase('THE GREAT ESCAPE')     → 'The Great Escape'
//      initials('ada lovelace')          → 'AL'
//      initials('  grace   hopper ')     → 'GH'
//
//  capitalize upper-cases the first character and LOWER-cases the rest.
//  titleCase applies capitalize to each space-separated word.
//  initials takes the first letter of each word, upper-cased, glued
//  together — extra whitespace must not produce empty initials.

import { test, eq } from '../../_lib/check.js';

export function capitalize(word) {
  throw new Error('TODO');
}

export function titleCase(text) {
  throw new Error('TODO');
}

export function initials(fullName) {
  throw new Error('TODO');
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
