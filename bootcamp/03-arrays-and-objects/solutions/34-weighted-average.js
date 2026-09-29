// ─────────────────────────────────────────────────────────────────────────
//  34 · weighted averages — SOLUTION                       ★★☆ core
//  run: node 34-weighted-average.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a weighted average is Σ(value × weight) / Σ(weight), which
//  is why one fold carrying two running totals is the natural shape. The
//  plain average is the same formula with every weight equal to 1 — worth
//  noticing, because it means you only ever wrote one function. The guard
//  is the real lesson: `totalWeight === 0` must short-circuit, otherwise
//  you ship `NaN` into a template and the UI renders "NaN stars". The last
//  test is the reason the guard checks the TOTAL rather than the length:
//  weights of 3 and -1 sum to 2, and 30 + -4 over 2 is 13, a number well
//  outside the input range. Weighted averages only behave when the weights
//  are non-negative, and that is a validation job, not a maths job.

import { test, eq, approx } from '../../_lib/check.js';

const TRACKS = Object.freeze([
  Object.freeze({ id: 't1', title: 'Nightdrive',  rating: 5, plays: 120 }),
  Object.freeze({ id: 't2', title: 'Slow Tide',   rating: 3, plays: 40 }),
  Object.freeze({ id: 't3', title: 'Paper Lanes', rating: 4, plays: 0 }),
  Object.freeze({ id: 't4', title: 'Ember',       rating: 2, plays: 40 }),
]);

const ratingOf = (t) => t.rating;
const playsOf = (t) => t.plays;

export function plainAverage(items, valueOf) {
  return weightedAverage(items, valueOf, () => 1);
}

export function weightedAverage(items, valueOf, weightOf) {
  const { top, bottom } = items.reduce(
    (acc, item) => {
      const weight = weightOf(item);
      return {
        top: acc.top + valueOf(item) * weight,
        bottom: acc.bottom + weight,
      };
    },
    { top: 0, bottom: 0 }
  );
  return bottom === 0 ? null : top / bottom;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('plainAverage treats every item the same', () => {
  approx(plainAverage(TRACKS, ratingOf), 3.5);
});

test('weighting by plays pulls the average toward the hits', () => {
  approx(weightedAverage(TRACKS, ratingOf, playsOf), 4);
});

test('an item with zero weight cannot move the average', () => {
  const played = TRACKS.filter((t) => t.plays > 0);
  approx(
    weightedAverage(TRACKS, ratingOf, playsOf),
    weightedAverage(played, ratingOf, playsOf)
  );
});

test('scaling every weight changes nothing', () => {
  approx(
    weightedAverage(TRACKS, ratingOf, (t) => t.plays * 10),
    weightedAverage(TRACKS, ratingOf, playsOf)
  );
});

test('one item weighs in at its own value', () => {
  approx(weightedAverage([TRACKS[0]], ratingOf, playsOf), 5);
});

test('all weights zero is null, not NaN', () => {
  eq(weightedAverage(TRACKS, ratingOf, () => 0), null);
});

test('an empty list averages to null both ways', () => {
  eq(plainAverage([], ratingOf), null);
  eq(weightedAverage([], ratingOf, playsOf), null);
});

test('negative weights still divide by their true total', () => {
  const rows = [{ v: 10, w: 3 }, { v: 4, w: -1 }];
  approx(weightedAverage(rows, (r) => r.v, (r) => r.w), 13);
});
