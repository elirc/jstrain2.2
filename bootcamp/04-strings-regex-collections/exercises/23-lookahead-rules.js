// ─────────────────────────────────────────────────────────────────────────
//  23 · password rules with lookahead                           ★★☆ core
//  concepts: lookahead · negative lookahead · anchors
//  run: node 23-lookahead-rules.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A lookahead (?=...) asks "does this match starting here?" and then
//  hands the cursor back — it checks without consuming. That is what lets
//  ONE anchored regex demand four unrelated things about the same string.
//
//      isStrongPassword('Tr0ubadour!')   → true
//      isStrongPassword('tr0ubadour!')   → false  (no capital)
//      isStrongPassword('Tr0ub!')        → false  (under 10 characters)
//      isStrongPassword('Tr0ub adour!')  → false  (whitespace)
//
//  The rules: at least 10 characters, at least one lowercase letter, one
//  uppercase letter, one digit, and no whitespace anywhere.
//
//  passwordProblems names the rules that failed, always in this order —
//  'length', 'lowercase', 'uppercase', 'digit', 'space':
//
//      passwordProblems('Tr0ubadour!')   → []
//      passwordProblems('abc')           → ['length', 'uppercase', 'digit']
//      passwordProblems('Ab1 cdefghij')  → ['space']
//
//  hint: (?=.*[A-Z]) is "somewhere ahead there is a capital"; (?!.*\s) is
//  its negative twin. Stack them right after ^, before you spend a single
//  character on .{10,}$ — a lookahead that consumed input could not.

import { test, eq } from '../../_lib/check.js';

export function isStrongPassword(password) {
  throw new Error('TODO');
}

export function passwordProblems(password) {
  throw new Error('TODO');
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
