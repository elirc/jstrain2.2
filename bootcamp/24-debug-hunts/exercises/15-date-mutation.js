// ─────────────────────────────────────────────────────────────────────────
//  15 · date ranges                                          ★★★ stretch
//  concepts: bug hunt · Date mutability · pure helpers
//  run: node 15-date-mutation.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Scheduling helpers, all in UTC so nothing here depends on a machine's
//  timezone. `utcDate` takes a HUMAN month (1 = January). Every helper
//  in this file is pure: it reads the Dates it is given and returns new
//  values, so the same anchor can be reused as often as you like.
//
//      utcDate(2024, 1, 15)                  → Mon 15 Jan 2024, UTC
//      isoDate(utcDate(2024, 1, 15))         → '2024-01-15'
//      addDays(utcDate(2024, 1, 31), 1)      → 1 Feb 2024
//      daysBetween(jan15, jan31)             → 16
//      dateRange(utcDate(2024, 1, 15), 4)
//        → ['2024-01-15', '2024-01-16', '2024-01-17', '2024-01-18']
//
//  The code below is fully written — and wrong. 3 tests fail. Find the
//  bug, fix it with the smallest change. Don't rewrite.
//
//  hint: the values coming out look right, so stop staring at return
//  values. Print each input again AFTER the call that used it and
//  compare it with what you passed in. Bugs that only show up on the
//  SECOND call are almost never in the code you are reading twice.

import { test, eq, ok } from '../../_lib/check.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export function utcDate(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day));
}

export function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(date, days) {
  return new Date(date.setUTCDate(date.getUTCDate() + days));
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
