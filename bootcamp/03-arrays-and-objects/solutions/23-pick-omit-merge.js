// ─────────────────────────────────────────────────────────────────────────
//  23 · pick · omit · shallow merge — SOLUTION             ★★☆ core
//  run: node 23-pick-omit-merge.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `pick` filters the KEY list (so unknown keys disappear
//  instead of turning into undefined properties), `omit` filters the ENTRY
//  list. `merge` is `Object.assign({}, ...objects)` — note the fresh `{}`
//  target, because `Object.assign(first, second)` mutates `first`, which is
//  the bug this exercise exists to inoculate you against. Everything here
//  is SHALLOW: a nested object is copied by reference, so the merged result
//  and the source still point at the same inner object, and editing it
//  "through" the copy changes the original. That is the setup for the next
//  exercise.

import { test, eq, ok } from '../../_lib/check.js';

export function pick(obj, keys) {
  return Object.fromEntries(
    keys.filter((key) => key in obj).map((key) => [key, obj[key]])
  );
}

export function omit(obj, keys) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keys.includes(key))
  );
}

export function merge(...objects) {
  return Object.assign({}, ...objects);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('pick keeps only the listed keys', () => {
  eq(pick({ a: 1, b: 2, c: 3 }, ['a', 'c']), { a: 1, c: 3 });
});

test('pick skips keys the object does not have', () => {
  eq(pick({ a: 1 }, ['a', 'zz']), { a: 1 });
});

test('omit removes the listed keys', () => {
  eq(omit({ a: 1, b: 2, c: 3 }, ['b']), { a: 1, c: 3 });
});

test('omit with no keys returns a copy, not the original', () => {
  const source = { a: 1 };
  const copy = omit(source, []);
  eq(copy, { a: 1 });
  ok(copy !== source);
});

test('merge layers objects left to right', () => {
  eq(merge({ a: 1 }, { b: 2 }, { c: 3 }), { a: 1, b: 2, c: 3 });
});

test('later objects win on a shared key', () => {
  eq(merge({ a: 1, b: 1 }, { a: 9 }), { a: 9, b: 1 });
});

test('merge does not mutate its arguments', () => {
  const defaults = Object.freeze({ theme: 'light', lang: 'en' });
  eq(merge(defaults, { theme: 'dark' }), { theme: 'dark', lang: 'en' });
  eq(defaults, { theme: 'light', lang: 'en' });
});

test('merge is shallow: nested objects are shared, not cloned', () => {
  const nested = { x: 1 };
  const merged = merge({ n: nested }, { other: true });
  ok(merged.n === nested);
});
