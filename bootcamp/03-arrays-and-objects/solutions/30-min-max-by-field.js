// ─────────────────────────────────────────────────────────────────────────
//  30 · min and max by field — SOLUTION                    ★☆☆ warm-up
//  run: node 30-min-max-by-field.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the accumulator is the current champion, so the comparison
//  is `valueOf(item) > valueOf(best)` — strictly greater, which is exactly
//  what makes ties keep the earlier item. Flip it to `>=` and the LAST tied
//  item wins instead; that difference is the whole bug report in a "why did
//  the leaderboard change order" ticket. `reduce` with no seed would work
//  here and would even give `undefined` for an empty list — by throwing —
//  so seed explicitly with `undefined` and skip the first comparison.
//  `extentBy` is the same fold done twice per step, which beats two passes
//  and matters once `valueOf` is expensive.

import { test, eq, ok } from '../../_lib/check.js';

const SESSIONS = Object.freeze([
  Object.freeze({ id: 's1', lift: 'squat',    weightKg: 100, reps: 5,  mins: 42 }),
  Object.freeze({ id: 's2', lift: 'bench',    weightKg: 70,  reps: 8,  mins: 35 }),
  Object.freeze({ id: 's3', lift: 'deadlift', weightKg: 140, reps: 3,  mins: 50 }),
  Object.freeze({ id: 's4', lift: 'row',      weightKg: 70,  reps: 10, mins: 28 }),
  Object.freeze({ id: 's5', lift: 'press',    weightKg: 45,  reps: 6,  mins: 31 }),
]);

export function maxBy(items, valueOf) {
  return items.reduce(
    (best, item) =>
      best === undefined || valueOf(item) > valueOf(best) ? item : best,
    undefined
  );
}

export function minBy(items, valueOf) {
  return items.reduce(
    (best, item) =>
      best === undefined || valueOf(item) < valueOf(best) ? item : best,
    undefined
  );
}

export function extentBy(items, valueOf) {
  return items.reduce(
    (extent, item) => ({
      min:
        extent.min === null || valueOf(item) < valueOf(extent.min)
          ? item
          : extent.min,
      max:
        extent.max === null || valueOf(item) > valueOf(extent.max)
          ? item
          : extent.max,
    }),
    { min: null, max: null }
  );
}

// ──────────────────────────── tests ──────────────────────────────────────

test('maxBy returns the heaviest session', () => {
  eq(maxBy(SESSIONS, (s) => s.weightKg).id, 's3');
});

test('minBy returns the lightest session', () => {
  eq(minBy(SESSIONS, (s) => s.weightKg).id, 's5');
});

test('the whole item comes back, not the number', () => {
  ok(maxBy(SESSIONS, (s) => s.reps) === SESSIONS[3]);
});

test('ties go to the item seen first', () => {
  const tied = [{ id: 'a', kg: 70 }, { id: 'b', kg: 70 }];
  eq(maxBy(tied, (t) => t.kg).id, 'a');
  eq(minBy(tied, (t) => t.kg).id, 'a');
});

test('an empty list has no winner', () => {
  eq(maxBy([], (x) => x), undefined);
  eq(minBy([], (x) => x), undefined);
});

test('extentBy reports both ends in one pass', () => {
  const { min, max } = extentBy(SESSIONS, (s) => s.mins);
  eq(min.id, 's4');
  eq(max.id, 's3');
});

test('extentBy of a one-item list reports it twice', () => {
  const { min, max } = extentBy([SESSIONS[1]], (s) => s.mins);
  ok(min === SESSIONS[1] && max === SESSIONS[1]);
});

test('extentBy of an empty list is two nulls', () => {
  eq(extentBy([], (x) => x), { min: null, max: null });
});
