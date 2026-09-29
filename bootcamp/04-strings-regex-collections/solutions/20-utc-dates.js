// ─────────────────────────────────────────────────────────────────────────
//  20 · dates in UTC, no library — SOLUTION                     ★★☆ core
//  run: node 20-utc-dates.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three rules make date code portable.
//    1. Read with getUTC*, never getMonth/getDate — the local getters
//       answer in the machine's timezone, so 2026-03-01T23:30Z prints as
//       the 2nd in Tokyo and the tests would depend on where you sit.
//    2. Months are ZERO-indexed both ways: +1 when formatting, -1 when
//       constructing. Off-by-one here is the single most common Date bug.
//    3. Build with Date.UTC(y, m, d), which returns a timestamp, wrapped
//       in new Date(...). new Date('2026-08-20') happens to parse as UTC,
//       but new Date('2026-08-20T00:00') is LOCAL — too subtle to rely on.
//  padStart(2, '0') does the zero padding; Number() on the split parts
//  avoids '08' being read as anything strange.

import { test, eq } from '../../_lib/check.js';

const pad2 = (n) => String(n).padStart(2, '0');

export function formatDate(date) {
  const year = date.getUTCFullYear();
  const month = pad2(date.getUTCMonth() + 1);
  const day = pad2(date.getUTCDate());
  return `${year}-${month}-${day}`;
}

export function parseDate(text) {
  const [year, month, day] = text.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function isWeekend(date) {
  const weekday = date.getUTCDay();
  return weekday === 0 || weekday === 6;
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
