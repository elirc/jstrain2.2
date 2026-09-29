// ─────────────────────────────────────────────────────────────────────────
//  09 · regex basics                                        ★☆☆ warm-up
//  concepts: regex · test · match · character classes · quantifiers
//  run: node 09-regex-basics.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Six tokens carry most regexes: \d (a digit), \w (letter/digit/_), \s
//  (whitespace), + (one or more), * (zero or more), and [...] (any one of
//  these). That is enough for all three functions here.
//
//      hasDigit('abc1')            → true
//      hasDigit('abc')             → false
//      firstNumber('order 66 now') → '66'      (a STRING, not a number)
//      firstNumber('no digits')    → null
//      allNumbers('a1b22c333')     → ['1', '22', '333']
//      allNumbers('nothing')       → []
//
//  re.test(str) answers yes/no. str.match(re) without /g returns a match
//  array (or null); WITH /g it returns an array of the matched strings —
//  or null when there is no match at all. That null is the classic trap:
//  allNumbers must still return an array.

import { test, eq } from '../../_lib/check.js';

export function hasDigit(text) {
  throw new Error('TODO');
}

export function firstNumber(text) {
  throw new Error('TODO');
}

export function allNumbers(text) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('hasDigit finds a digit anywhere in the string', () => {
  eq(hasDigit('abc1'), true);
  eq(hasDigit('1abc'), true);
});

test('hasDigit is false when there are no digits', () => {
  eq(hasDigit('abc'), false);
  eq(hasDigit(''), false);
});

test('firstNumber returns the first run of digits as a string', () => {
  eq(firstNumber('order 66 ships 7 crates'), '66');
});

test('firstNumber returns null when there is no number', () => {
  eq(firstNumber('no digits here'), null);
});

test('allNumbers returns every run of digits', () => {
  eq(allNumbers('a1b22c333'), ['1', '22', '333']);
});

test('allNumbers keeps multi-digit runs together', () => {
  eq(allNumbers('room 101, floor 12'), ['101', '12']);
});

test('allNumbers returns an empty array, not null', () => {
  eq(allNumbers('nothing to see'), []);
});
