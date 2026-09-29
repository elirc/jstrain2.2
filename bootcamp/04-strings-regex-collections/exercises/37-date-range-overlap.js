// ─────────────────────────────────────────────────────────────────────────
//  37 · overlapping date ranges                              ★★★ stretch
//  concepts: half-open intervals · comparing Dates · merging
//  run: node 37-date-range-overlap.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Booking systems, calendars, rota planners — they all come down to
//  "do these two ranges collide?". A range here is { start, end } with
//  start INSIDE and end OUTSIDE (half-open), which is what makes
//  back-to-back bookings legal.
//
//      A = Jan 1 .. Jan 10       B = Jan 5 .. Jan 20
//      overlaps(A, B)     → true
//      intersection(A, B) → Jan 5 .. Jan 10
//
//      overlaps(Jan 1 .. Jan 10, Jan 10 .. Jan 20)  → false  (they touch)
//
//      mergeRanges([Jan 10..Jan 20, Jan 1..Jan 5, Jan 5..Jan 8])
//        → [Jan 1..Jan 8, Jan 10..Jan 20]
//
//  Two ranges overlap when each starts before the other ends. Touching
//  ranges do NOT overlap — but mergeRanges still joins them, because a
//  gap of zero days is not a gap. mergeRanges returns a sorted list of
//  NEW range objects and must not modify the ones it was handed.
//
//  hint: overlaps is one line, and it is a.start < b.end && b.start <
//  a.end — try to enumerate the cases instead and you will write four
//  branches and still miss one. For merge: sort by start, then either
//  extend the last range you kept or push a copy.

import { test, eq } from '../../_lib/check.js';

// Provided scaffolding: build and print half-open UTC ranges.
const day = (iso) => new Date(iso + 'T00:00:00Z');
const range = (from, to) => ({ start: day(from), end: day(to) });
const show = (r) =>
  r === null
    ? null
    : `${r.start.toISOString().slice(0, 10)}..${r.end.toISOString().slice(0, 10)}`;

export function overlaps(a, b) {
  throw new Error('TODO');
}

export function intersection(a, b) {
  throw new Error('TODO');
}

export function mergeRanges(ranges) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('two ranges that share days overlap', () => {
  eq(overlaps(range('2026-01-01', '2026-01-10'), range('2026-01-05', '2026-01-20')), true);
});

test('ranges that only touch do not overlap', () => {
  eq(overlaps(range('2026-01-01', '2026-01-10'), range('2026-01-10', '2026-01-20')), false);
});

test('a range wholly inside another overlaps; a distant one does not', () => {
  eq(overlaps(range('2026-01-01', '2026-01-31'), range('2026-01-10', '2026-01-12')), true);
  eq(overlaps(range('2026-01-01', '2026-01-05'), range('2026-02-01', '2026-02-05')), false);
});

test('the order of the arguments does not matter', () => {
  const a = range('2026-01-01', '2026-01-10');
  const b = range('2026-01-05', '2026-01-20');
  eq(overlaps(b, a), overlaps(a, b));
  eq(overlaps(b, a), true);
});

test('intersection returns the span the two ranges share', () => {
  eq(
    show(intersection(range('2026-01-01', '2026-01-10'), range('2026-01-05', '2026-01-20'))),
    '2026-01-05..2026-01-10'
  );
});

test('intersection of ranges that do not overlap is null', () => {
  eq(intersection(range('2026-01-01', '2026-01-05'), range('2026-02-01', '2026-02-05')), null);
  eq(intersection(range('2026-01-01', '2026-01-10'), range('2026-01-10', '2026-01-20')), null);
});

test('mergeRanges sorts, then joins the ones that overlap or touch', () => {
  const input = [
    range('2026-01-10', '2026-01-20'),
    range('2026-01-01', '2026-01-05'),
    range('2026-01-05', '2026-01-08'),
    range('2026-01-15', '2026-01-25'),
  ];
  eq(mergeRanges(input).map(show), [
    '2026-01-01..2026-01-08',
    '2026-01-10..2026-01-25',
  ]);
  eq(show(input[0]), '2026-01-10..2026-01-20');
});

test('mergeRanges leaves separate ranges separate', () => {
  eq(
    mergeRanges([range('2026-03-01', '2026-03-02'), range('2026-01-01', '2026-01-02')]).map(show),
    ['2026-01-01..2026-01-02', '2026-03-01..2026-03-02']
  );
  eq(mergeRanges([]), []);
});
