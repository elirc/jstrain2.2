// ─────────────────────────────────────────────────────────────────────────
//  20 · dates in UTC, no library                                ★★☆ core
//  concepts: Date.UTC · getUTC* · zero-indexed months · padStart
//  run: node 20-utc-dates.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Date has two parallel APIs: the local one (getMonth, getDate) and the
//  UTC one (getUTCMonth, getUTCDate). Use the local one in a library and
//  your tests pass in Berlin and fail in Tokyo. Use UTC only.
//
//      formatDate(new Date(Date.UTC(2026, 0, 5)))  → '2026-01-05'
//      parseDate('2026-08-20').toISOString()
//                                    → '2026-08-20T00:00:00.000Z'
//      isWeekend(parseDate('2026-08-22'))          → true   (a Saturday)
//      isWeekend(parseDate('2026-08-20'))          → false  (a Thursday)
//
//  Month is ZERO-INDEXED in both Date.UTC(y, m, d) and getUTCMonth() —
//  January is 0. formatDate must pad month and day to two digits.
//  parseDate takes 'YYYY-MM-DD' and returns midnight UTC on that day.
//  isWeekend is Saturday (getUTCDay() === 6) or Sunday (0).
//
//  hint: String(n).padStart(2, '0') — and Date.UTC returns a timestamp
//  number, so it needs a new Date(...) around it.

import { test, eq } from '../../_lib/check.js';

export function formatDate(date) {
  throw new Error('TODO');
}

export function parseDate(text) {
  throw new Error('TODO');
}

export function isWeekend(date) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('formatDate pads the month and day, counting months from 1', () => {
  eq(formatDate(new Date(Date.UTC(2026, 0, 5))), '2026-01-05');
});

test('formatDate handles two-digit months and days', () => {
  eq(formatDate(new Date(Date.UTC(2026, 11, 25))), '2026-12-25');
});

test('formatDate ignores the machine timezone', () => {
  eq(formatDate(new Date('2026-03-01T23:30:00Z')), '2026-03-01');
  eq(formatDate(new Date('2026-03-01T00:30:00Z')), '2026-03-01');
});

test('parseDate returns midnight UTC on that day', () => {
  eq(parseDate('2026-08-20').toISOString(), '2026-08-20T00:00:00.000Z');
});

test('parseDate handles single-digit months', () => {
  eq(parseDate('2026-01-02').toISOString(), '2026-01-02T00:00:00.000Z');
});

test('parseDate and formatDate round-trip', () => {
  eq(formatDate(parseDate('1999-12-31')), '1999-12-31');
  eq(formatDate(parseDate('2000-02-29')), '2000-02-29');
});

test('isWeekend is true on Saturday and Sunday', () => {
  eq(isWeekend(parseDate('2026-08-22')), true);
  eq(isWeekend(parseDate('2026-08-23')), true);
});

test('isWeekend is false on a weekday', () => {
  eq(isWeekend(parseDate('2026-08-20')), false);
  eq(isWeekend(parseDate('2026-08-24')), false);
});
