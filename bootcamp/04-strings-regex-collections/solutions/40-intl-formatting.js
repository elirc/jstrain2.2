// ─────────────────────────────────────────────────────────────────────────
//  40 · Intl: dates, "3 days ago", and human sorting — SOLUTION  ★★☆ core
//  run: node 40-intl-formatting.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: all three formatters are built once at module level.
//  Constructing an Intl formatter is the expensive part — reusing one in
//  a loop over 10k rows is the difference between milliseconds and
//  seconds — and it also puts the locale in one visible place.
//  'en-US' is spelled out every time. So is timeZone: 'UTC' on the date
//  formatter, and the two together are what make these tests give the
//  same answer in Kiritimati and in Anchorage: without the timeZone the
//  23:30Z timestamp formats as the NEXT day east of Greenwich and the
//  00:30Z one as the PREVIOUS day to the west.
//  relativeDays does its own arithmetic — Intl only formats. The whole-day
//  difference comes from the timestamps, rounded so that any stray hours
//  cannot turn one day into zero, and numeric: 'auto' is what upgrades
//  ±1 and 0 into 'yesterday' / 'today' / 'tomorrow'.
//  Collator is the sort nobody writes correctly by hand: numeric: true
//  reads digit runs as numbers ('item2' before 'item10'), and
//  sensitivity: 'base' folds case and accents so 'Émile' lands next to
//  'Emile' instead of after 'Zoe'. Plain .sort() compares UTF-16 code
//  units, which puts every capital letter before every lowercase one.

import { test, eq } from '../../_lib/check.js';

// Provided scaffolding: build UTC days.
const day = (iso) => new Date(iso + 'T00:00:00Z');

const DAY_MS = 86400000;

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const RELATIVE = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });

const COLLATOR = new Intl.Collator('en-US', {
  sensitivity: 'base',
  numeric: true,
});

export function formatUTCDate(date) {
  return DATE_FORMAT.format(date);
}

export function relativeDays(from, to) {
  const days = Math.round((to.getTime() - from.getTime()) / DAY_MS);
  return RELATIVE.format(days, 'day');
}

export function sortNames(names) {
  return [...names].sort(COLLATOR.compare);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('formatUTCDate prints the US short-month form', () => {
  eq(formatUTCDate(day('2026-08-20')), 'Aug 20, 2026');
  eq(formatUTCDate(day('2026-12-25')), 'Dec 25, 2026');
});

test('formatUTCDate does not pad the day', () => {
  eq(formatUTCDate(day('2026-01-05')), 'Jan 5, 2026');
});

test('formatUTCDate stays on the UTC day, whatever the machine thinks', () => {
  eq(formatUTCDate(new Date('2026-03-01T23:30:00Z')), 'Mar 1, 2026');
  eq(formatUTCDate(new Date('2026-03-01T00:30:00Z')), 'Mar 1, 2026');
});

test('relativeDays looks backwards', () => {
  eq(relativeDays(day('2026-08-20'), day('2026-08-17')), '3 days ago');
  eq(relativeDays(day('2026-08-20'), day('2026-07-21')), '30 days ago');
});

test('relativeDays looks forwards', () => {
  eq(relativeDays(day('2026-08-20'), day('2026-08-22')), 'in 2 days');
  eq(relativeDays(day('2026-08-20'), day('2026-08-27')), 'in 7 days');
});

test('relativeDays uses words for the nearest days', () => {
  eq(relativeDays(day('2026-08-20'), day('2026-08-19')), 'yesterday');
  eq(relativeDays(day('2026-08-20'), day('2026-08-20')), 'today');
  eq(relativeDays(day('2026-08-20'), day('2026-08-21')), 'tomorrow');
});

test('sortNames compares the numbers inside names as numbers', () => {
  eq(sortNames(['item10', 'Item1', 'item2']), ['Item1', 'item2', 'item10']);
});

test('sortNames ignores case and accents when ordering', () => {
  eq(sortNames(['Zoe', 'apple', 'Émile']), ['apple', 'Émile', 'Zoe']);
  eq(sortNames(['b', 'A']), ['A', 'b']);
});

test('sortNames returns a new array', () => {
  const names = ['c', 'a', 'b'];
  eq(sortNames(names), ['a', 'b', 'c']);
  eq(names, ['c', 'a', 'b']);
});
