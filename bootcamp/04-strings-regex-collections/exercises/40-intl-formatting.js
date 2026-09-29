// ─────────────────────────────────────────────────────────────────────────
//  40 · Intl: dates, "3 days ago", and human sorting             ★★☆ core
//  concepts: DateTimeFormat · RelativeTimeFormat · Collator
//  run: node 40-intl-formatting.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Intl does the work you should never hand-roll: month names, "in 2
//  days", and sorting text the way a person would. Every constructor
//  takes a locale, and leaving it out means "whatever this machine is
//  set to" — which is how a test suite passes on your laptop and fails
//  in CI. Pass 'en-US'. For dates, pin timeZone: 'UTC' too.
//
//      formatUTCDate(new Date('2026-08-20T00:00:00Z'))  → 'Aug 20, 2026'
//      formatUTCDate(new Date('2026-03-01T23:30:00Z'))  → 'Mar 1, 2026'
//
//      relativeDays(day('2026-08-20'), day('2026-08-17'))  → '3 days ago'
//      relativeDays(day('2026-08-20'), day('2026-08-22'))  → 'in 2 days'
//      relativeDays(day('2026-08-20'), day('2026-08-19'))  → 'yesterday'
//
//      sortNames(['item10', 'Item1', 'item2'])
//        → ['Item1', 'item2', 'item10']
//
//  formatUTCDate wants short month, numeric day, numeric year.
//  relativeDays(from, to) describes `to` as seen from `from`, in whole
//  days, and says 'yesterday' / 'today' / 'tomorrow' rather than
//  '1 day ago' — that is the numeric: 'auto' option.
//  sortNames returns a NEW array, sorted so that numbers inside names
//  compare as numbers and case and accents do not decide the order.
//
//  hint: new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' })
//  .format(-3, 'day'); a Collator gives you a compare function, so
//  [...names].sort(collator.compare) is the whole sort. Build each
//  formatter ONCE at module level, not inside the function — they are
//  expensive to construct.

import { test, eq } from '../../_lib/check.js';

// Provided scaffolding: build UTC days.
const day = (iso) => new Date(iso + 'T00:00:00Z');

export function formatUTCDate(date) {
  throw new Error('TODO');
}

export function relativeDays(from, to) {
  throw new Error('TODO');
}

export function sortNames(names) {
  throw new Error('TODO');
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
