// ─────────────────────────────────────────────────────────────────────────
//  06 · truncate and mask — SOLUTION                            ★★☆ core
//  run: node 06-truncate-and-mask.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: truncate budgets the ellipsis. The naive version is
//  text.slice(0, max) + '...' — which returns max + 3 characters and
//  blows out the column it was supposed to fit. Subtracting the suffix
//  length first (max - 3) is the whole exercise; the early return keeps
//  strings that already fit byte-identical.
//  maskCard rebuilds the string from two halves: stars for everything but
//  the tail, then the tail. Using padStart('*') on the last four is the
//  same idea in one call — pick whichever you find readable.

import { test, eq } from '../../_lib/check.js';

const ELLIPSIS = '...';

export function truncate(text, max) {
  if (text.length <= max) return text;
  return text.slice(0, max - ELLIPSIS.length) + ELLIPSIS;
}

export function maskCard(digits) {
  if (digits.length <= 4) return digits;
  return digits.slice(-4).padStart(digits.length, '*');
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
