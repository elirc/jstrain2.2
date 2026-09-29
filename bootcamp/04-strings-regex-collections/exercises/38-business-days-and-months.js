// ─────────────────────────────────────────────────────────────────────────
//  38 · business days and month arithmetic                       ★★☆ core
//  concepts: getUTCDay · Date.UTC roll-over · clamping to month end
//  run: node 38-business-days-and-months.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Two date questions that sound trivial and are not: "how many working
//  days is that?" and "what is a month from now?".
//
//      businessDaysBetween(day('2026-08-17'), day('2026-08-22'))  → 5
//      businessDaysBetween(day('2026-08-20'), day('2026-08-25'))  → 3
//      businessDaysBetween(day('2026-08-22'), day('2026-08-24'))  → 0
//
//  Count Mon–Fri from `from` (counted) up to `to` (not counted). A range
//  that is empty or backwards is 0. No holidays — just weekends.
//
//      addMonths(day('2026-01-31'), 1)   → 2026-02-28   ← clamped
//      addMonths(day('2028-01-31'), 1)   → 2028-02-29   ← leap year
//      addMonths(day('2026-03-31'), -1)  → 2026-02-28
//
//  There is no 31st of February, so "add a month" has to clamp to the
//  last day of the target month. Everything is UTC: getUTCDay, Date.UTC,
//  getUTCDate — the local getters would give a different answer on a
//  laptop in Auckland.
//
//  hint: Date.UTC(y, m, 0) is the LAST day of month m-1, which is how you
//  ask "how many days does that month have?" without a table. And month
//  11 + 3 is month 14 — Date.UTC rolls that into the next year for you,
//  as long as you do the arithmetic on the month number.

import { test, eq } from '../../_lib/check.js';

// Provided scaffolding: build and print UTC days.
const day = (iso) => new Date(iso + 'T00:00:00Z');
const iso = (date) => date.toISOString().slice(0, 10);

export function businessDaysBetween(from, to) {
  throw new Error('TODO');
}

export function addMonths(date, n) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('counts the working days of one week', () => {
  eq(businessDaysBetween(day('2026-08-17'), day('2026-08-22')), 5);
});

test('the weekend does not count', () => {
  eq(businessDaysBetween(day('2026-08-22'), day('2026-08-24')), 0);
  eq(businessDaysBetween(day('2026-08-17'), day('2026-08-24')), 5);
});

test('the end day is not counted, and the range may cross a weekend', () => {
  eq(businessDaysBetween(day('2026-08-20'), day('2026-08-25')), 3);
  eq(businessDaysBetween(day('2026-08-20'), day('2026-08-21')), 1);
});

test('an empty or backwards range is zero', () => {
  eq(businessDaysBetween(day('2026-08-20'), day('2026-08-20')), 0);
  eq(businessDaysBetween(day('2026-08-25'), day('2026-08-20')), 0);
});

test('counts the working days of a whole year', () => {
  eq(businessDaysBetween(day('2026-01-01'), day('2027-01-01')), 261);
});

test('addMonths clamps the 31st to the end of a short month', () => {
  eq(iso(addMonths(day('2026-01-31'), 1)), '2026-02-28');
  eq(iso(addMonths(day('2026-08-31'), 1)), '2026-09-30');
});

test('addMonths knows about leap years', () => {
  eq(iso(addMonths(day('2028-01-31'), 1)), '2028-02-29');
});

test('addMonths rolls over the year in both directions', () => {
  eq(iso(addMonths(day('2026-11-30'), 3)), '2027-02-28');
  eq(iso(addMonths(day('2026-03-31'), -1)), '2026-02-28');
  eq(iso(addMonths(day('2026-05-15'), -14)), '2025-03-15');
});

test('addMonths returns a new Date and leaves the original alone', () => {
  const start = day('2026-01-31');
  eq(iso(addMonths(start, 1)), '2026-02-28');
  eq(iso(start), '2026-01-31');
});
