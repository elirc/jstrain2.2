// ─────────────────────────────────────────────────────────────────────────
//  46 · renameKeys and prefixKeys                          ★☆☆ warm-up
//  concepts: entries round trip · key collisions
//  run: node 46-rename-and-prefix-keys.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Spreadsheet exports arrive with headings like `Weight (kg)`. Before that
//  row can be an object your code enjoys touching, the keys have to be
//  rewritten — and everything else has to pass through untouched.
//
//      renameKeys(ROW, MAPPING)   → { lift: 'Back Squat', weightKg: 100, … }
//      prefixKeys({ reps: 5 }, 'gym_')  → { gym_reps: 5 }
//      mapKeys({ a: 1 }, k => k.toUpperCase())  → { A: 1 }
//
//  hint: `Object.entries` down, `map` the pair, `Object.fromEntries` back.
//  Two keys renamed onto the same name is a collision — last one wins,
//  the same way an object literal does.

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
  throw new Error('TODO');
}

export function prefixKeys(obj, prefix) {
  throw new Error('TODO');
}

export function mapKeys(obj, keyFn) {
  throw new Error('TODO');
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
