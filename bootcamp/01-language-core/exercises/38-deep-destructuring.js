// ─────────────────────────────────────────────────────────────────────────
//  38 · deep destructuring                                      ★★☆ core
//  concepts: mixed array/object patterns · defaults at every level
//  run: node 38-deep-destructuring.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A route file arrives half-filled from three different exporters. Flatten
//  it into a summary in ONE destructuring pattern — objects inside arrays
//  inside objects, with a default at every level so nothing can throw.
//
//      summarize(ROUTE)
//      → { name: 'Ridge', startX: 3, startY: 4, mode: 'climb',
//          author: 'Ada', legCount: 2 }
//
//  The coordinates come from the FIRST leg's `from` pair; legCount counts
//  all the legs. The defaults:
//
//      name 'untitled' · startX/startY 0 · mode 'walk'
//      author 'unknown' · legCount 0
//
//  summarize(), summarize(null) and summarize({}) must all return exactly
//  those defaults rather than throwing. Assume `from`, when present, is an
//  array and `legs`, when present, is an array of objects.
//
//  hint: a pattern can read the same key twice — once to dig into the
//  first element, once to keep the whole array. `= []` and `= {}` fire on
//  undefined only, so `null` still reaches you unchanged.

import { test, eq } from '../../_lib/check.js';

const ROUTE = {
  name: 'Ridge',
  legs: [
    { from: [3, 4], to: [3, 9], mode: 'climb' },
    { from: [3, 9], to: [7, 9] },
  ],
  meta: { author: { name: 'Ada' } },
};

const DEFAULTS = {
  name: 'untitled',
  startX: 0,
  startY: 0,
  mode: 'walk',
  author: 'unknown',
  legCount: 0,
};

export function summarize(route) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('reads the first leg, the author and the leg count', () => {
  eq(summarize(ROUTE), {
    name: 'Ridge',
    startX: 3,
    startY: 4,
    mode: 'climb',
    author: 'Ada',
    legCount: 2,
  });
});

test('missing pieces fall back field by field', () => {
  eq(summarize({ legs: [{ from: [1, 2] }] }), {
    name: 'untitled',
    startX: 1,
    startY: 2,
    mode: 'walk',
    author: 'unknown',
    legCount: 1,
  });
});

test('an empty leg list does not throw', () => {
  eq(summarize({ name: 'Flat', legs: [] }), { ...DEFAULTS, name: 'Flat' });
  eq(summarize({ name: 'Flat', legs: [{}] }), {
    ...DEFAULTS,
    name: 'Flat',
    legCount: 1,
  });
});

test('nothing at all still produces the full default summary', () => {
  eq(summarize({}), DEFAULTS);
  eq(summarize(), DEFAULTS);
  eq(summarize(null), DEFAULTS);
});

test('defaults replace undefined only — an explicit null survives', () => {
  eq(summarize({ name: null }).name, null);
  eq(summarize({ name: undefined }).name, 'untitled');
  eq(summarize({ legs: [{ mode: null }] }).mode, null);
  eq(summarize({ meta: { author: { name: null } } }).author, null);
});

test('legCount counts every leg, not just the one it read', () => {
  eq(summarize({ legs: [{}, {}, {}] }).legCount, 3);
  eq(summarize(ROUTE).legCount, 2);
});

test('a half-filled coordinate pair fills only the missing half', () => {
  eq(summarize({ legs: [{ from: [5] }] }).startX, 5);
  eq(summarize({ legs: [{ from: [5] }] }).startY, 0);
  eq(summarize({ legs: [{ from: [] }] }).startX, 0);
  eq(summarize({ legs: [{ from: [0, 0] }] }).startY, 0);
});

test('the author is reached through two levels of default', () => {
  eq(summarize({ meta: {} }).author, 'unknown');
  eq(summarize({ meta: { author: {} } }).author, 'unknown');
  eq(summarize({ meta: { author: { name: 'Bo' } } }).author, 'Bo');
});
