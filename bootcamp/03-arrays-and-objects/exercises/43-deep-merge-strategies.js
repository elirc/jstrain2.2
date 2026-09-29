// ─────────────────────────────────────────────────────────────────────────
//  43 · deep merge with array strategies                   ★★★ stretch
//  concepts: recursion · shallow-vs-deep · undefined vs null
//  run: node 43-deep-merge-strategies.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `{ ...base, ...patch }` is what you reach for and it is wrong the moment
//  the config has a second level: a patch that only sets `theme.accent`
//  wipes out `theme.mode`. Write the deep version — and make the array rule
//  a decision instead of an accident.
//
//      deepMerge(BASE, PATCH)                        → arrays replaced
//      deepMerge(BASE, PATCH, { arrays: 'concat' })  → ['timer','charts',…]
//      deepMerge(BASE, PATCH, { arrays: 'union' })   → the same, de-duped
//
//  `undefined` in a patch means "I have no opinion" and is skipped; `null`
//  means "erase this" and overwrites. Neither input may be touched.
//
//  hint: recurse only when BOTH sides are plain objects. Arrays are
//  objects too — check `Array.isArray` first or you will merge them by
//  index and get `{ 0: 'a', 1: 'b' }`.

import { test, eq, ok } from '../../_lib/check.js';

const deepFreeze = (value) => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
  }
  return Object.freeze(value);
};

const BASE = deepFreeze({
  app: { name: 'gymlog', theme: { mode: 'dark', accent: 'lime' } },
  units: 'kg',
  plugins: ['timer', 'charts'],
  limits: { sets: 8, rest: 90 },
});

const PATCH = deepFreeze({
  app: { theme: { accent: 'coral' } },
  plugins: ['charts', 'export'],
  limits: { rest: 120 },
  beta: true,
});

export function deepMerge(base, patch, options = {}) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('nested objects merge instead of replacing each other', () => {
  const merged = deepMerge(BASE, PATCH);
  eq(merged.app.theme, { mode: 'dark', accent: 'coral' });
  eq(merged.app.name, 'gymlog');
});

test('keys only in the base survive, keys only in the patch arrive', () => {
  const merged = deepMerge(BASE, PATCH);
  eq(merged.units, 'kg');
  eq(merged.limits, { sets: 8, rest: 120 });
  eq(merged.beta, true);
});

test('arrays are replaced by default, and copied on the way out', () => {
  const merged = deepMerge(BASE, PATCH);
  eq(merged.plugins, ['charts', 'export']);
  ok(merged.plugins !== PATCH.plugins);
});

test('the concat strategy appends, duplicates and all', () => {
  const merged = deepMerge(BASE, PATCH, { arrays: 'concat' });
  eq(merged.plugins, ['timer', 'charts', 'charts', 'export']);
});

test('the union strategy appends and de-duplicates', () => {
  const merged = deepMerge(BASE, PATCH, { arrays: 'union' });
  eq(merged.plugins, ['timer', 'charts', 'export']);
});

test('neither input is mutated', () => {
  deepMerge(BASE, PATCH, { arrays: 'concat' });
  eq(BASE.app.theme.accent, 'lime');
  eq(BASE.limits.rest, 90);
  eq(PATCH.plugins, ['charts', 'export']);
});

test('null erases, undefined is ignored', () => {
  const merged = deepMerge(BASE, { units: null, app: undefined });
  eq(merged.units, null);
  eq(merged.app, BASE.app);
});

test('the whole merge lands on the expected object', () => {
  eq(deepMerge(BASE, PATCH), {
    app: { name: 'gymlog', theme: { mode: 'dark', accent: 'coral' } },
    units: 'kg',
    plugins: ['charts', 'export'],
    limits: { sets: 8, rest: 120 },
    beta: true,
  });
});
