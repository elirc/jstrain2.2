// ─────────────────────────────────────────────────────────────────────────
//  39 · ISO week numbers and a calendar grid — SOLUTION      ★★★ stretch
//  run: node 39-iso-week-and-calendar.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the Thursday trick is the whole exercise. ISO week 1 is
//  the week containing the first Thursday of the year, which is the same
//  as saying "the week whose Thursday falls in that year". So: jump from
//  any date to the Thursday of ITS week, and that Thursday's calendar
//  year IS the ISO week-numbering year — no January/December special
//  cases, no off-by-one at the year boundary. Then count whole weeks from
//  the Thursday of week 1 (found by running the same jump on January 4th,
//  which is always in week 1) and add one.
//  mondayIndex converts getUTCDay's Sunday-is-0 into Monday-is-0. Get
//  that backwards and every answer is off by a day at the week edges.
//  Note both helpers build a NEW date out of Date.UTC with a day number
//  that may be negative or past the end of the month — Date.UTC carries
//  the overflow for you, which is why no mutation and no clamping is
//  needed here.
//  monthGrid is the same indexing plus chunking: `lead` nulls, then the
//  day numbers, then nulls until the length divides by seven. Slicing
//  seven at a time turns the flat list into rows.

import { test, eq } from '../../_lib/check.js';

// Provided scaffolding: build UTC days.
const day = (iso) => new Date(iso + 'T00:00:00Z');

const WEEK_MS = 7 * 86400000;

// Monday = 0 … Sunday = 6
const mondayIndex = (date) => (date.getUTCDay() + 6) % 7;

const thursdayOfWeek = (date) =>
  new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() - mondayIndex(date) + 3
    )
  );

export function isoWeek(date) {
  const thursday = thursdayOfWeek(date);
  const year = thursday.getUTCFullYear();
  const firstThursday = thursdayOfWeek(new Date(Date.UTC(year, 0, 4)));
  const week = 1 + Math.round((thursday.getTime() - firstThursday.getTime()) / WEEK_MS);
  return { year, week };
}

export function monthGrid(year, month) {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const dayCount = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const cells = [
    ...Array(mondayIndex(first)).fill(null),
    ...Array.from({ length: dayCount }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
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
