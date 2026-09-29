// ─────────────────────────────────────────────────────────────────────────
//  21 · date math and durations — SOLUTION                      ★★☆ core
//  run: node 21-date-math.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: addDays adds n × 86_400_000 ms to the timestamp and wraps
//  the result in a new Date — new object, original untouched. The mutating
//  version, date.setUTCDate(date.getUTCDate() + n), is the classic wrong
//  turn: it edits the caller's date and returns a number, not a Date.
//  (Adding whole days to a UTC timestamp is exact; the same trick on a
//  LOCAL date breaks twice a year, when a day is 23 or 25 hours long.)
//  diffInDays subtracts the timestamps — Date coerces to a number in
//  arithmetic — and divides. Math.round, not floor, so an hour of clock
//  drift between two midnights cannot turn 1 day into 0.
//  humanizeDuration floors to whole seconds, splits with / and %, then
//  keeps only the non-zero units — with a fallback so 0 prints '0s'
//  instead of an empty string.

import { test, eq } from '../../_lib/check.js';

// Provided scaffolding: build and print UTC days without a library.
const day = (iso) => new Date(iso + 'T00:00:00Z');
const iso = (date) => date.toISOString().slice(0, 10);

const DAY_MS = 86400000;

export function addDays(date, n) {
  return new Date(date.getTime() + n * DAY_MS);
}

export function diffInDays(from, to) {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

export function humanizeDuration(ms) {
  const total = Math.floor(ms / 1000);
  const parts = [
    [Math.floor(total / 3600), 'h'],
    [Math.floor(total / 60) % 60, 'm'],
    [total % 60, 's'],
  ];
  const shown = parts
    .filter(([value]) => value > 0)
    .map(([value, unit]) => `${value}${unit}`);
  return shown.length > 0 ? shown.join(' ') : '0s';
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
