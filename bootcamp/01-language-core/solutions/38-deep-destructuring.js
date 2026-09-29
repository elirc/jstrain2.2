// ─────────────────────────────────────────────────────────────────────────
//  38 · deep destructuring — SOLUTION                           ★★☆ core
//  run: node 38-deep-destructuring.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: read the pattern from the outside in. Every level that can
//  be missing gets its own `= {}` or `= []`, because a default only rescues
//  the level it is attached to — `{ meta: { author: {} } = {} }` still
//  throws when `meta` is there but `author` is not, which is why there are
//  two defaults on that line.
//
//  Reading `legs` twice is the trick worth keeping: once as a pattern to
//  reach into element 0, once as a plain binding to keep the whole array.
//  A destructuring pattern is a set of property reads, so nothing stops
//  you reading the same property in two shapes.
//
//  `route ?? {}` covers the two cases a parameter default cannot: an
//  explicit `null` argument, and no argument at all. Everything below it
//  then only has to survive `undefined`.

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
  const {
    name = 'untitled',
    legs: [{ from: [startX = 0, startY = 0] = [], mode = 'walk' } = {}] = [],
    legs: allLegs = [],
    meta: { author: { name: author = 'unknown' } = {} } = {},
  } = route ?? {};
  return { name, startX, startY, mode, author, legCount: allLegs.length };
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
