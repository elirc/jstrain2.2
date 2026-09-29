// ─────────────────────────────────────────────────────────────────────────
//  30 · duration strings                                         ★★☆ core
//  concepts: matchAll · a unit table · validate then parse
//  run: node 30-duration-strings.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Config files and CLI flags are full of '30s', '1h30m', '7d'. Convert
//  both ways. Units are d, h, m, s — no weeks, no months, nothing
//  ambiguous. (Exercise 21 PRINTED the spaced form '2h 5m 3s'; this is
//  the compact one, and this time you have to read it back in too.)
//
//      parseDuration('45s')      → 45000
//      parseDuration('1h30m')    → 5400000
//      parseDuration('1h 30m')   → 5400000     (spaces allowed)
//      parseDuration('5x')       → null        (unknown unit)
//      parseDuration('')         → null
//
//      formatDuration(5400000)   → '1h30m'
//      formatDuration(90000)     → '1m30s'
//      formatDuration(0)         → '0s'
//
//  formatDuration prints the units largest first and skips the zeros, so
//  every canonical string round-trips: format(parse(s)) === s.
//
//  hint: validate the WHOLE string first with an anchored pattern, then
//  loop over [...text.matchAll(/(\d+)([dhms])/g)] and add up the pieces.
//  Parsing without validating is how '5 bananas' quietly becomes 5000.

import { test, eq } from '../../_lib/check.js';

export function parseDuration(text) {
  throw new Error('TODO');
}

export function formatDuration(ms) {
  throw new Error('TODO');
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
