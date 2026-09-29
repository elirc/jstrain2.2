// ─────────────────────────────────────────────────────────────────────────
//  15 · date ranges — SOLUTION                               ★★★ stretch
//  run: node 15-date-mutation.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: bug class — shared mutable Date. `date.setUTCDate(…)`
//  edits the Date in place and returns a NUMBER, the new timestamp. So
//  `new Date(date.setUTCDate(…))` really does hand back a fresh object
//  with the right value — while quietly moving the caller's date. Every
//  test that calls addDays once passes; the damage only shows on the
//  second use of the same anchor.
//
//  The tell: a setter called on a parameter. Date's setters are the only
//  common JS API that both mutates and returns something useful, which
//  is exactly why the wrapper reads as if it copies. `dateRange` walking
//  its cursor forward by 0, 1, 2, 3 and landing on 15, 16, 18, 21 is the
//  arithmetic signature of an accumulating mutation.
//
//  The minimal fix: copy first, then set. Three lines that can never lie
//  about what they touch. `new Date(date.getTime() + days * DAY_MS)` is
//  also correct HERE only because the whole file is UTC — across a DST
//  boundary in local time, adding 24 hours is not adding a day.
//
//  The classic wild variant: `getMonth()` returning 0 for January, so a
//  hand-built `${y}-${m}-${d}` string is a month early all year. Same
//  family of pain, and the reason `utcDate` above takes a human month
//  and does the -1 once, at the edge, where it can be read.

import { test, eq, ok } from '../../_lib/check.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export function utcDate(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day));
}

export function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(date, days) {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

export function daysBetween(from, to) {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

export function isWeekend(date) {
  const weekday = date.getUTCDay();
  return weekday === 0 || weekday === 6;
}

export function nextBusinessDay(date) {
  let next = addDays(date, 1);
  while (isWeekend(next)) {
    next = addDays(next, 1);
  }
  return next;
}

export function dateRange(start, count) {
  const days = [];
  for (let i = 0; i < count; i++) {
    days.push(isoDate(addDays(start, i)));
  }
  return days;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('utcDate takes a human month and isoDate prints it back', () => {
  eq(isoDate(utcDate(2024, 1, 15)), '2024-01-15');
  eq(isoDate(utcDate(2024, 3, 1)), '2024-03-01');
  eq(isoDate(utcDate(2024, 12, 31)), '2024-12-31');
});

test('addDays crosses month, year and leap-day edges', () => {
  eq(isoDate(addDays(utcDate(2024, 1, 31), 1)), '2024-02-01');
  eq(isoDate(addDays(utcDate(2024, 3, 1), -1)), '2024-02-29');
  eq(isoDate(addDays(utcDate(2024, 12, 31), 1)), '2025-01-01');
  eq(isoDate(addDays(utcDate(2024, 1, 15), 0)), '2024-01-15');
});

test('daysBetween counts whole days in both directions', () => {
  eq(daysBetween(utcDate(2024, 1, 15), utcDate(2024, 1, 31)), 16);
  eq(daysBetween(utcDate(2024, 3, 1), utcDate(2024, 2, 1)), -29);
  eq(daysBetween(utcDate(2024, 1, 15), utcDate(2024, 1, 15)), 0);
});

test('nextBusinessDay steps over the weekend', () => {
  eq(isoDate(nextBusinessDay(utcDate(2024, 1, 19))), '2024-01-22');
  eq(isoDate(nextBusinessDay(utcDate(2024, 1, 15))), '2024-01-16');
  eq(isWeekend(utcDate(2024, 1, 20)), true);
  eq(isWeekend(utcDate(2024, 1, 19)), false);
});

test('an empty range is empty and a one-day range is one day', () => {
  eq(dateRange(utcDate(2024, 1, 15), 0), []);
  eq(dateRange(utcDate(2024, 1, 15), 1), ['2024-01-15']);
});

test('addDays leaves the date it was handed alone', () => {
  const anchor = utcDate(2024, 1, 15);
  const later = addDays(anchor, 10);
  eq(isoDate(later), '2024-01-25');
  ok(later !== anchor, 'a new Date should come back');
  eq(isoDate(anchor), '2024-01-15');
});

test('dateRange lists consecutive days across a month edge', () => {
  eq(dateRange(utcDate(2024, 1, 15), 4), [
    '2024-01-15', '2024-01-16', '2024-01-17', '2024-01-18',
  ]);
  eq(dateRange(utcDate(2024, 1, 30), 4), [
    '2024-01-30', '2024-01-31', '2024-02-01', '2024-02-02',
  ]);
});

test('the same anchor can be handed to two ranges', () => {
  const anchor = utcDate(2024, 1, 15);
  const first = dateRange(anchor, 3);
  const second = dateRange(anchor, 3);
  eq(first, second);
  eq(isoDate(anchor), '2024-01-15');
});
