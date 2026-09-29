// ─────────────────────────────────────────────────────────────────────────
//  23 · password rules with lookahead — SOLUTION                ★★☆ core
//  run: node 23-lookahead-rules.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: each rule is an independent question about the WHOLE
//  string, so each one gets its own lookahead at position 0. A lookahead
//  matches and then rewinds, which is why four of them can stack in front
//  of .{10,}$ — every one of them starts its search from the same spot.
//  The classic wrong turn is writing /^[a-z][A-Z]\d.{7,}$/ and wondering
//  why 'Tr0ubadour!' fails: without lookahead, the classes have to appear
//  in that exact order, one after another.
//  (?!.*\s) is the negative form — "there is NO whitespace ahead". Note
//  that `.` never matches a newline, so a password with a line break also
//  fails .{10,} even before the lookahead sees it.
//  passwordProblems is the same rules again, one regex each, so a caller
//  can tell the user WHICH rule broke. Keeping them in a table (name +
//  regex) keeps the two functions honest about the same rule set.

import { test, eq } from '../../_lib/check.js';

const STRONG = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?!.*\s).{10,}$/;

const RULES = [
  ['length', /^.{10,}$/],
  ['lowercase', /[a-z]/],
  ['uppercase', /[A-Z]/],
  ['digit', /\d/],
  ['space', /^\S*$/],
];

export function isStrongPassword(password) {
  return STRONG.test(password);
}

export function passwordProblems(password) {
  return RULES.filter(([, re]) => !re.test(password)).map(([name]) => name);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('accepts a password that satisfies every rule', () => {
  eq(isStrongPassword('Tr0ubadour!'), true);
  eq(isStrongPassword('Passw0rd123'), true);
});

test('rejects a password under ten characters', () => {
  eq(isStrongPassword('Tr0ub!'), false);
  eq(isStrongPassword('Passw0rd1'), false);
});

test('rejects a password missing a character class', () => {
  eq(isStrongPassword('troubadour1!'), false);
  eq(isStrongPassword('TROUBADOUR1!'), false);
  eq(isStrongPassword('Troubadour!!'), false);
});

test('rejects whitespace anywhere in the password', () => {
  eq(isStrongPassword('Tr0ub adour!'), false);
  eq(isStrongPassword(' Tr0ubadour!'), false);
});

test('lookahead does not consume, so the class order is free', () => {
  eq(isStrongPassword('aA1bbbbbbbb'), true);
  eq(isStrongPassword('1Aabbbbbbbb'), true);
});

test('passwordProblems is empty for a strong password', () => {
  eq(passwordProblems('Tr0ubadour!'), []);
});

test('passwordProblems names every broken rule, in order', () => {
  eq(passwordProblems('abc'), ['length', 'uppercase', 'digit']);
  eq(passwordProblems('ABCDEFGHIJ'), ['lowercase', 'digit']);
});

test('passwordProblems reports whitespace on its own', () => {
  eq(passwordProblems('Ab1 cdefghij'), ['space']);
});
