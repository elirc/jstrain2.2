// ─────────────────────────────────────────────────────────────────────────
//  09 · regex basics — SOLUTION                             ★☆☆ warm-up
//  run: node 09-regex-basics.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: \d+ means "one or more digits", so it grabs whole numbers
//  instead of single characters — dropping the + is why naive versions
//  return ['1','0','1'] for 'room 101'.
//  test() answers yes/no. match() WITHOUT /g returns a match array whose
//  [0] is the matched text, so ?.[0] safely turns "no match" into
//  undefined — and ?? null makes the contract explicit.
//  match() WITH /g returns an array of strings, or null when nothing
//  matched at all. That null is the trap: `?? []` keeps the return type
//  honest so callers can always .map over the result.

import { test, eq } from '../../_lib/check.js';

export function hasDigit(text) {
  return /\d/.test(text);
}

export function firstNumber(text) {
  return text.match(/\d+/)?.[0] ?? null;
}

export function allNumbers(text) {
  return text.match(/\d+/g) ?? [];
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
