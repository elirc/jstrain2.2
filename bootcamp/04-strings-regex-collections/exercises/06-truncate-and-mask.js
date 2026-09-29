// ─────────────────────────────────────────────────────────────────────────
//  06 · truncate and mask                                       ★★☆ core
//  concepts: slice · padStart · length budgets
//  run: node 06-truncate-and-mask.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Two things every UI needs: shorten long text, and hide secrets.
//
//      truncate('The quick brown fox', 10)  → 'The qui...'   (10 chars)
//      truncate('short', 10)                → 'short'
//      maskCard('4111111111111111')         → '************1111'
//      maskCard('1234')                     → '1234'
//
//  truncate: if the text already fits in `max`, return it untouched.
//  Otherwise the RESULT — ellipsis included — must be exactly `max`
//  characters. That is the bit people get wrong.
//
//  maskCard: keep the last 4 characters, replace every earlier character
//  with '*'. Values of 4 characters or fewer come back unchanged.
//
//  hint: how many characters of the original survive if '...' costs 3?

import { test, eq } from '../../_lib/check.js';

export function truncate(text, max) {
  throw new Error('TODO');
}

export function maskCard(digits) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('truncate leaves short text alone', () => {
  eq(truncate('short', 10), 'short');
});

test('truncate leaves text of exactly max alone', () => {
  eq(truncate('exactlyten', 10), 'exactlyten');
});

test('truncate clips and appends an ellipsis', () => {
  eq(truncate('The quick brown fox', 10), 'The qui...');
});

test('the truncated result is never longer than max', () => {
  eq(truncate('The quick brown fox', 10).length, 10);
  eq(truncate('abcdefghijklmnop', 5).length, 5);
});

test('maskCard keeps the last four digits', () => {
  eq(maskCard('4111111111111111').slice(-4), '1111');
});

test('maskCard stars out everything else and keeps the length', () => {
  eq(maskCard('4111111111111111'), '************1111');
  eq(maskCard('378282246310005'), '***********0005');
});

test('maskCard leaves short values alone', () => {
  eq(maskCard('1234'), '1234');
  eq(maskCard('12'), '12');
});
