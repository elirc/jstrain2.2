// ─────────────────────────────────────────────────────────────────────────
//  23 · pick · omit · shallow merge                        ★★☆ core
//  concepts: spread · Object.assign · shallow copies
//  run: node 23-pick-omit-merge.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Trimming an object down before you send it over the wire, and layering
//  defaults under overrides.
//
//      pick({ a: 1, b: 2, c: 3 }, ['a', 'c'])  → { a: 1, c: 3 }
//      pick({ a: 1 }, ['a', 'zz'])             → { a: 1 }   no zz: undefined
//      omit({ a: 1, b: 2, c: 3 }, ['b'])       → { a: 1, c: 3 }
//      merge({ a: 1, b: 1 }, { a: 9 })         → { a: 9, b: 1 }
//
//  `merge` takes any number of objects, later ones win, and it must not
//  touch the objects it was given.
//
//  hint: a missing key and a key holding undefined are different things —
//  `'zz' in obj` tells them apart.

import { test, eq, ok } from '../../_lib/check.js';

export function pick(obj, keys) {
  throw new Error('TODO');
}

export function omit(obj, keys) {
  throw new Error('TODO');
}

export function merge(...objects) {
  throw new Error('TODO');
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
