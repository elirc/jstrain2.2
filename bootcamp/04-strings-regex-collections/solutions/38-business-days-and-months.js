// ─────────────────────────────────────────────────────────────────────────
//  38 · business days and month arithmetic — SOLUTION            ★★☆ core
//  run: node 38-business-days-and-months.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: businessDaysBetween walks the range one day at a time on
//  the TIMESTAMP — t += DAY_MS — and asks getUTCDay() for each. Stepping
//  in UTC milliseconds is exact; the same loop written with setDate on a
//  local date silently gains or loses an hour twice a year, and a range
//  that crosses a DST switch then miscounts a day. A backwards range
//  never enters the loop, so it answers 0 without a special case.
//  (Closed form: whole weeks × 5 plus the leftovers. The loop is the one
//  you can still read a year later, and a few thousand iterations is
//  nothing.)
//  addMonths does arithmetic on the month NUMBER and lets Date.UTC do the
//  carrying — month 11 + 3 becomes month 14, which Date.UTC reads as
//  February of the next year. The clamp is the real lesson:
//  Date.UTC(y, m + 1, 0) is "day zero of the next month", i.e. the last
//  day of this one, so Math.min keeps Jan 31 + 1 month from spilling into
//  March 3rd. That spill is exactly what the naive setUTCMonth(m + 1)
//  does, and it is the classic wrong turn here.

import { test, eq } from '../../_lib/check.js';

// Provided scaffolding: build and print UTC days.
const day = (iso) => new Date(iso + 'T00:00:00Z');
const iso = (date) => date.toISOString().slice(0, 10);

const DAY_MS = 86400000;

export function businessDaysBetween(from, to) {
  let count = 0;
  for (let t = from.getTime(); t < to.getTime(); t += DAY_MS) {
    const weekday = new Date(t).getUTCDay();
    if (weekday !== 0 && weekday !== 6) count += 1;
  }
  return count;
}

export function addMonths(date, n) {
  const targetMonth = date.getUTCMonth() + n;
  const year = date.getUTCFullYear() + Math.floor(targetMonth / 12);
  const month = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), lastDay)));
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
