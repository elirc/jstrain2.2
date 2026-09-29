// ─────────────────────────────────────────────────────────────────────────
//  39 · ISO week numbers and a calendar grid                 ★★★ stretch
//  concepts: ISO 8601 weeks · Monday-first indexing · chunking
//  run: node 39-iso-week-and-calendar.js
// ─────────────────────────────────────────────────────────────────────────
//
//  "Week 34" is not "the 34th block of seven days". ISO 8601 says weeks
//  run Monday to Sunday, and week 1 is the week that holds the first
//  THURSDAY of the year. So a week can belong to a year its days do not.
//
//      isoWeek(day('2026-08-20'))  → { year: 2026, week: 34 }
//      isoWeek(day('2027-01-01'))  → { year: 2026, week: 53 }  ← last year
//      isoWeek(day('2019-12-30'))  → { year: 2020, week: 1 }   ← next year
//
//  monthGrid is what a date picker draws: whole Monday-first weeks as
//  rows, day numbers inside the month, null in the cells before the 1st
//  and after the last day.
//
//      monthGrid(2026, 6)   // June 2026 starts on a Monday
//        → [[ 1,  2,  3,  4,  5,  6,  7],
//           [ 8,  9, 10, 11, 12, 13, 14],
//           [15, 16, 17, 18, 19, 20, 21],
//           [22, 23, 24, 25, 26, 27, 28],
//           [29, 30, null, null, null, null, null]]
//
//  The month argument is 1–12 (January is 1), unlike Date's own indexing.
//  Everything in UTC.
//
//  hint: getUTCDay() calls Sunday 0, so (getUTCDay() + 6) % 7 turns it
//  into a Monday-first index. For the week number, find the Thursday of
//  the date's own week and the Thursday of week 1, and count the days
//  between them — the Thursday trick removes every edge case at once.
//  Date.UTC(y, m, 0) is the last day of the previous month.

import { test, eq } from '../../_lib/check.js';

// Provided scaffolding: build UTC days.
const day = (iso) => new Date(iso + 'T00:00:00Z');

export function isoWeek(date) {
  throw new Error('TODO');
}

export function monthGrid(year, month) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('numbers a week in the middle of the year', () => {
  eq(isoWeek(day('2026-08-20')), { year: 2026, week: 34 });
  eq(isoWeek(day('2026-06-15')), { year: 2026, week: 25 });
});

test('week 1 is the week holding the first Thursday', () => {
  eq(isoWeek(day('2026-01-01')), { year: 2026, week: 1 });
  eq(isoWeek(day('2025-12-29')), { year: 2026, week: 1 });
});

test('early January can still belong to last year', () => {
  eq(isoWeek(day('2027-01-01')), { year: 2026, week: 53 });
});

test('late December can already belong to next year', () => {
  eq(isoWeek(day('2019-12-30')), { year: 2020, week: 1 });
  eq(isoWeek(day('2020-01-01')), { year: 2020, week: 1 });
});

test('a month that starts on Monday has no leading blanks', () => {
  const june = monthGrid(2026, 6);
  eq(june[0], [1, 2, 3, 4, 5, 6, 7]);
  eq(june.at(-1), [29, 30, null, null, null, null, null]);
});

test('the blanks pad the first and last week', () => {
  const february = monthGrid(2026, 2);
  eq(february[0], [null, null, null, null, null, null, 1]);
  eq(february.at(-1), [23, 24, 25, 26, 27, 28, null]);
});

test('every row is a full week of seven cells', () => {
  for (const month of [1, 2, 6, 8, 12]) {
    const grid = monthGrid(2026, month);
    eq(grid.every((week) => week.length === 7), true);
  }
});

test('every day of the month appears once, in order', () => {
  const days = monthGrid(2026, 8).flat().filter((d) => d !== null);
  eq(days.length, 31);
  eq(days[0], 1);
  eq(days.at(-1), 31);
});
