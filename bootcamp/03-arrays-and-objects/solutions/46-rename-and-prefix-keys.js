// ─────────────────────────────────────────────────────────────────────────
//  46 · renameKeys and prefixKeys — SOLUTION               ★☆☆ warm-up
//  run: node 46-rename-and-prefix-keys.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: objects have no `.map`, so every key transform is the same
//  three-step round trip — `entries` down, array work in the middle,
//  `fromEntries` back up. Write `mapKeys` first and the other two are one
//  line each: renaming is `mapping[key] ?? key` (the `??` is what lets
//  unmapped keys through), prefixing is a template string. The collision
//  test is the part people forget: `fromEntries` builds the object left to
//  right, so two keys landing on the same name behave exactly like writing
//  the same key twice in a literal — no error, no warning, the later value
//  simply wins. Note also that key order is preserved from the source, and
//  that number-like keys (`mapKeys(row, k => k.length)`) jump to the front
//  in ascending numeric order, because `Object.keys` sorts integer keys.

import { test, eq } from '../../_lib/check.js';

const ROW = Object.freeze({
  'Exercise Name': 'Back Squat',
  'Weight (kg)': 100,
  reps: 5,
});

const MAPPING = Object.freeze({
  'Exercise Name': 'lift',
  'Weight (kg)': 'weightKg',
  'Rest (s)': 'restSeconds',
});

export function renameKeys(obj, mapping) {
  return mapKeys(obj, (key) => mapping[key] ?? key);
}

export function prefixKeys(obj, prefix) {
  return mapKeys(obj, (key) => `${prefix}${key}`);
}

export function mapKeys(obj, keyFn) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [keyFn(key), value])
  );
}

// ──────────────────────────── tests ──────────────────────────────────────

test('mapped keys are renamed and their values ride along', () => {
  const row = renameKeys(ROW, MAPPING);
  eq(row.lift, 'Back Squat');
  eq(row.weightKg, 100);
});

test('unmapped keys pass through untouched', () => {
  eq(renameKeys(ROW, MAPPING).reps, 5);
  eq(Object.keys(renameKeys(ROW, MAPPING)), ['lift', 'weightKg', 'reps']);
});

test('a mapping for a key that is not there is simply unused', () => {
  eq('restSeconds' in renameKeys(ROW, MAPPING), false);
});

test('two keys renamed onto one name collide, and the last wins', () => {
  eq(renameKeys({ a: 1, b: 2 }, { a: 'x', b: 'x' }), { x: 2 });
});

test('the frozen row is never edited', () => {
  renameKeys(ROW, MAPPING);
  eq(ROW['Exercise Name'], 'Back Squat');
});

test('prefixKeys stamps every key', () => {
  eq(prefixKeys({ reps: 5, mins: 42 }, 'gym_'), { gym_reps: 5, gym_mins: 42 });
});

test('prefixing nothing gives nothing', () => {
  eq(prefixKeys({}, 'gym_'), {});
});

test('mapKeys is the general case both of the others are built from', () => {
  eq(mapKeys({ a: 1, b: 2 }, (k) => k.toUpperCase()), { A: 1, B: 2 });
  eq(mapKeys(ROW, (k) => k.length), { 13: 'Back Squat', 11: 100, 4: 5 });
});
