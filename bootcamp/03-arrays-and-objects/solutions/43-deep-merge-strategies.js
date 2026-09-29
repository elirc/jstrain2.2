// ─────────────────────────────────────────────────────────────────────────
//  43 · deep merge with array strategies — SOLUTION        ★★★ stretch
//  run: node 43-deep-merge-strategies.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the recursion is three lines; the judgement is in the
//  branch order. Test arrays BEFORE plain objects, because `typeof [] ===
//  'object'` and merging two arrays as objects gives you index keys and a
//  broken config. Recurse only when both sides are plain objects — if the
//  base has a string and the patch has an object, the patch simply wins.
//  Skipping `undefined` is what makes `deepMerge(config, { debug: flags
//  .debug })` safe when the flag was never set, while `null` deliberately
//  survives as an erase. And there is no ONE right array rule: replacing is
//  the least surprising default, concat is what event-handler lists want,
//  union is what plugin lists want. Libraries that pick silently for you
//  are the reason "why did my array double" tickets exist.

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

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const mergeArrays = (left, right, strategy) => {
  if (strategy === 'concat') return [...left, ...right];
  if (strategy === 'union') return [...new Set([...left, ...right])];
  return [...right];
};

export function deepMerge(base, patch, options = {}) {
  const { arrays = 'replace' } = options;
  const merged = { ...base };

  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    const current = merged[key];
    if (Array.isArray(current) && Array.isArray(value)) {
      merged[key] = mergeArrays(current, value, arrays);
    } else if (isPlainObject(current) && isPlainObject(value)) {
      merged[key] = deepMerge(current, value, options);
    } else {
      merged[key] = value;
    }
  }

  return merged;
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
