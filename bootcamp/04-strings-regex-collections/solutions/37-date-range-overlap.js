// ─────────────────────────────────────────────────────────────────────────
//  37 · overlapping date ranges — SOLUTION                   ★★★ stretch
//  run: node 37-date-range-overlap.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: overlaps is the interval-overlap one-liner —
//  a.start < b.end && b.start < a.end. It is worth memorising, because
//  the "obvious" version (enumerate: b starts inside a, or a starts
//  inside b, or one contains the other…) is four branches that still
//  misses a case. The strict < is what makes touching ranges legal:
//  swap in <= and back-to-back bookings start colliding.
//  Dates compare directly with < and > because they coerce to their
//  timestamp — but NOT with === or ==, which compare object identity.
//  That is why intersection goes through getTime() and Math.max/min:
//  Math.max on Dates would coerce anyway, but doing it explicitly says
//  "this is number work" out loud.
//  mergeRanges sorts a COPY by start (sort mutates), then walks once: if
//  the next range starts on or before the end of the one being built,
//  stretch that end; otherwise start a new one. `<=` here — not `<` —
//  because touching ranges leave no gap and should become one range.
//  Every kept range is a fresh object, so extending `last.end` can never
//  reach back and edit the caller's data.

import { test, eq } from '../../_lib/check.js';

// Provided scaffolding: build and print half-open UTC ranges.
const day = (iso) => new Date(iso + 'T00:00:00Z');
const range = (from, to) => ({ start: day(from), end: day(to) });
const show = (r) =>
  r === null
    ? null
    : `${r.start.toISOString().slice(0, 10)}..${r.end.toISOString().slice(0, 10)}`;

export function overlaps(a, b) {
  return a.start < b.end && b.start < a.end;
}

export function intersection(a, b) {
  if (!overlaps(a, b)) return null;
  return {
    start: new Date(Math.max(a.start.getTime(), b.start.getTime())),
    end: new Date(Math.min(a.end.getTime(), b.end.getTime())),
  };
}

export function mergeRanges(ranges) {
  const sorted = [...ranges].sort((x, y) => x.start - y.start);
  const merged = [];

  for (const r of sorted) {
    const last = merged.at(-1);
    if (last !== undefined && r.start <= last.end) {
      if (r.end > last.end) last.end = r.end;
    } else {
      merged.push({ start: r.start, end: r.end });
    }
  }
  return merged;
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
