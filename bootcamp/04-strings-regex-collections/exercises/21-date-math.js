// ─────────────────────────────────────────────────────────────────────────
//  21 · date math and durations                                 ★★☆ core
//  concepts: timestamps · immutability · integer division
//  run: node 21-date-math.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A Date is a number of milliseconds wearing a costume. Once you accept
//  that, date math is arithmetic — as long as you stay in UTC.
//
//      addDays(day('2026-01-31'), 1)   → 2026-02-01   (rolls over)
//      addDays(day('2026-03-01'), -1)  → 2026-02-28
//      diffInDays(day('2026-01-01'), day('2026-03-01'))  → 59
//      diffInDays(day('2026-03-01'), day('2026-01-01'))  → -59
//      humanizeDuration(7503000)  → '2h 5m 3s'
//      humanizeDuration(65000)    → '1m 5s'
//      humanizeDuration(3605000)  → '1h 5s'   (zero minutes is skipped)
//      humanizeDuration(0)        → '0s'
//
//  addDays returns a NEW Date and must not touch the one it was given.
//  diffInDays counts whole days from a to b (negative if b is earlier).
//  humanizeDuration drops any unit that is zero, but never returns ''.
//
//  hint: 86400000 ms in a day. Build humanize as an array of parts and
//  join(' ') — filtering the zero ones out before you join.

import { test, eq } from '../../_lib/check.js';

// Provided scaffolding: build and print UTC days without a library.
const day = (iso) => new Date(iso + 'T00:00:00Z');
const iso = (date) => date.toISOString().slice(0, 10);

export function addDays(date, n) {
  throw new Error('TODO');
}

export function diffInDays(from, to) {
  throw new Error('TODO');
}

export function humanizeDuration(ms) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('addDays moves forward across a month boundary', () => {
  eq(iso(addDays(day('2026-01-31'), 1)), '2026-02-01');
});

test('addDays accepts a negative count', () => {
  eq(iso(addDays(day('2026-03-01'), -1)), '2026-02-28');
});

test('addDays returns a new Date and leaves the original alone', () => {
  const start = day('2026-05-10');
  const later = addDays(start, 5);
  eq(iso(later), '2026-05-15');
  eq(iso(start), '2026-05-10');
});

test('diffInDays counts whole days between two dates', () => {
  eq(diffInDays(day('2026-01-01'), day('2026-03-01')), 59);
  eq(diffInDays(day('2026-08-20'), day('2026-08-21')), 1);
});

test('diffInDays is negative when the second date is earlier', () => {
  eq(diffInDays(day('2026-03-01'), day('2026-01-01')), -59);
  eq(diffInDays(day('2026-01-01'), day('2026-01-01')), 0);
});

test('humanizeDuration prints hours, minutes and seconds', () => {
  eq(humanizeDuration(7503000), '2h 5m 3s');
});

test('humanizeDuration drops the units that are zero', () => {
  eq(humanizeDuration(65000), '1m 5s');
  eq(humanizeDuration(3600000), '1h');
  eq(humanizeDuration(3605000), '1h 5s');
});

test('humanizeDuration floors to whole seconds and never returns ""', () => {
  eq(humanizeDuration(0), '0s');
  eq(humanizeDuration(500), '0s');
  eq(humanizeDuration(1999), '1s');
});
