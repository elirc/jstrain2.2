// ─────────────────────────────────────────────────────────────────────────
//  30 · duration strings — SOLUTION                              ★★☆ core
//  run: node 30-duration-strings.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: validate, then parse. The anchored ^(?:\d+[dhms]\s*)+$
//  test is what makes '5 bananas' and '10' return null — matchAll on its
//  own would find the '5' in '5 bananas', ignore the rest, and hand back a
//  confident wrong answer. Reject first, add up second.
//  UNIT_MS doubles as the unit table for both directions, and because its
//  keys are plain strings (not integer-like), Object.entries walks them in
//  the order they were written: d, h, m, s — largest first, which is
//  exactly the order formatDuration needs to print.
//  formatDuration subtracts what it prints, so each unit only reports its
//  own remainder; the `parts.length ? … : '0s'` fallback keeps a zero
//  duration from formatting as ''. Sub-second input floors away, which is
//  why 500 also prints '0s'.

import { test, eq } from '../../_lib/check.js';

const UNIT_MS = { d: 86400000, h: 3600000, m: 60000, s: 1000 };

export function parseDuration(text) {
  if (!/^\s*(?:\d+[dhms]\s*)+$/.test(text)) return null;
  let total = 0;
  for (const [, amount, unit] of text.matchAll(/(\d+)([dhms])/g)) {
    total += Number(amount) * UNIT_MS[unit];
  }
  return total;
}

export function formatDuration(ms) {
  let left = ms;
  const parts = [];
  for (const [unit, size] of Object.entries(UNIT_MS)) {
    const n = Math.floor(left / size);
    if (n > 0) {
      parts.push(`${n}${unit}`);
      left -= n * size;
    }
  }
  return parts.length > 0 ? parts.join('') : '0s';
}

// ──────────────────────────── tests ──────────────────────────────────────

test('parses a single unit', () => {
  eq(parseDuration('45s'), 45000);
  eq(parseDuration('2h'), 7200000);
  eq(parseDuration('2d'), 172800000);
});

test('adds up several units', () => {
  eq(parseDuration('1h30m'), 5400000);
  eq(parseDuration('1d2h3m4s'), 93784000);
});

test('allows spaces between the parts', () => {
  eq(parseDuration('1h 30m'), 5400000);
  eq(parseDuration(' 45s '), 45000);
});

test('returns null for junk and for the empty string', () => {
  eq(parseDuration(''), null);
  eq(parseDuration('soon'), null);
  eq(parseDuration('5 bananas'), null);
});

test('returns null for an unknown unit or a bare number', () => {
  eq(parseDuration('5x'), null);
  eq(parseDuration('10'), null);
});

test('formatDuration prints the units largest first', () => {
  eq(formatDuration(5400000), '1h30m');
  eq(formatDuration(93784000), '1d2h3m4s');
});

test('formatDuration skips the units that are zero', () => {
  eq(formatDuration(90000), '1m30s');
  eq(formatDuration(172800000), '2d');
  eq(formatDuration(3601000), '1h1s');
});

test('formatDuration never returns an empty string', () => {
  eq(formatDuration(0), '0s');
  eq(formatDuration(500), '0s');
});

test('every canonical string round-trips', () => {
  for (const text of ['45s', '1h30m', '2d', '1d2h3m4s']) {
    eq(formatDuration(parseDuration(text)), text);
  }
});
