// ─────────────────────────────────────────────────────────────────────────
//  30 · min and max by field                               ★☆☆ warm-up
//  concepts: reduce · returning the item, not the number
//  run: node 30-min-max-by-field.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `Math.max(...sessions.map(s => s.weightKg))` gives you 140. It does not
//  give you the session. Almost every time you want the winner, you want
//  the whole row — the id, the name, the link you are about to render.
//
//      maxBy(SESSIONS, (s) => s.weightKg)   → the deadlift session
//      minBy(SESSIONS, (s) => s.weightKg)   → the press session
//      extentBy(SESSIONS, (s) => s.mins)    → { min: …, max: … } items
//
//  Ties go to the item seen first. An empty list has no winner:
//  `undefined` from min/max, `{ min: null, max: null }` from extentBy.
//
//  hint: one reduce, and the accumulator is an item — not a number.

import { test, eq, ok } from '../../_lib/check.js';

const SESSIONS = Object.freeze([
  Object.freeze({ id: 's1', lift: 'squat',    weightKg: 100, reps: 5,  mins: 42 }),
  Object.freeze({ id: 's2', lift: 'bench',    weightKg: 70,  reps: 8,  mins: 35 }),
  Object.freeze({ id: 's3', lift: 'deadlift', weightKg: 140, reps: 3,  mins: 50 }),
  Object.freeze({ id: 's4', lift: 'row',      weightKg: 70,  reps: 10, mins: 28 }),
  Object.freeze({ id: 's5', lift: 'press',    weightKg: 45,  reps: 6,  mins: 31 }),
]);

export function maxBy(items, valueOf) {
  throw new Error('TODO');
}

export function minBy(items, valueOf) {
  throw new Error('TODO');
}

export function extentBy(items, valueOf) {
  throw new Error('TODO');
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
