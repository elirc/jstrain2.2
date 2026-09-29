// ─────────────────────────────────────────────────────────────────────────
//  34 · weighted averages                                  ★★☆ core
//  concepts: two accumulators · divide-by-zero · null vs NaN
//  run: node 34-weighted-average.js
// ─────────────────────────────────────────────────────────────────────────
//
//  "Average rating 3.5 stars" is a lie when one track was played 120 times
//  and another was never played at all. Weight each rating by its plays and
//  the number stops flattering the tracks nobody listens to.
//
//      plainAverage(TRACKS, t => t.rating)               → 3.5
//      weightedAverage(TRACKS, t => t.rating, t => t.plays) → 4
//
//  Nothing to average means `null` — NOT `NaN`. `0/0` is `NaN`, `NaN`
//  survives `JSON.stringify` as `null` anyway, and every comparison you
//  make against it is false. Return the empty answer on purpose.
//
//  hint: one pass, two running totals: sum of value × weight, and sum of
//  weight. Check the second one before you divide.

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
  throw new Error('TODO');
}

export function weightedAverage(items, valueOf, weightOf) {
  throw new Error('TODO');
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
