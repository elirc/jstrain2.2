// ─────────────────────────────────────────────────────────────────────────
//  49 · leaning on a stable sort                           ★★☆ core
//  concepts: stability · multi-pass sorting · compound comparators
//  run: node 49-stable-sort-reliance.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `sort` has been stable since ES2019: items that compare equal keep the
//  order they arrived in. That guarantee buys you multi-key sorting for
//  free — sort by the LEAST significant key first, then by the next, and
//  each pass preserves the work of the one before it.
//
//      sortByKey(TRACKS, t => t.plays)          → one stable pass
//      multiPass(TRACKS, [artist, album, trackNo])   → passes, back to front
//      compound(TRACKS, [artist, album, trackNo])    → one comparator
//
//  The two must agree — proving that is the exercise.
//
//  hint: `(a, b) => a - b` only works for numbers. A comparator that
//  handles strings too is `a < b ? -1 : a > b ? 1 : 0` — and returning 0
//  for a tie is exactly what keeps the sort stable.

import { test, eq } from '../../_lib/check.js';

const TRACKS = Object.freeze([
  Object.freeze({ id: 'a', artist: 'Vela', album: 'Drift', trackNo: 2, plays: 40 }),
  Object.freeze({ id: 'b', artist: 'Ora',  album: 'Salt',  trackNo: 1, plays: 40 }),
  Object.freeze({ id: 'c', artist: 'Vela', album: 'Drift', trackNo: 1, plays: 12 }),
  Object.freeze({ id: 'd', artist: 'Ora',  album: 'Salt',  trackNo: 2, plays: 40 }),
  Object.freeze({ id: 'e', artist: 'Vela', album: 'Hush',  trackNo: 1, plays: 7 }),
]);

const artistOf = (t) => t.artist;
const albumOf = (t) => t.album;
const trackNoOf = (t) => t.trackNo;
const playsOf = (t) => t.plays;
const ids = (list) => list.map((t) => t.id);

export function sortByKey(items, keyOf) {
  throw new Error('TODO');
}

export function multiPass(items, keyFns) {
  throw new Error('TODO');
}

export function compound(items, keyFns) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('equal keys keep their source order', () => {
  eq(ids(sortByKey(TRACKS, playsOf)), ['e', 'c', 'a', 'b', 'd']);
});

test('string keys sort too, and the frozen list is not reordered', () => {
  eq(ids(sortByKey(TRACKS, artistOf)), ['b', 'd', 'a', 'c', 'e']);
  eq(ids(TRACKS), ['a', 'b', 'c', 'd', 'e']);
});

test('multiPass runs the passes from the last key back to the first', () => {
  eq(ids(multiPass(TRACKS, [artistOf, albumOf, trackNoOf])), [
    'b', 'd', 'c', 'a', 'e',
  ]);
});

test('one compound comparator gives the same order as the passes', () => {
  const keys = [artistOf, albumOf, trackNoOf];
  eq(ids(compound(TRACKS, keys)), ids(multiPass(TRACKS, keys)));
});

test('running the passes in the wrong order gives the wrong answer', () => {
  eq(ids(multiPass(TRACKS, [trackNoOf, albumOf, artistOf])), [
    'c', 'e', 'b', 'a', 'd',
  ]);
});

test('with a single key, all three are the same function', () => {
  eq(ids(compound(TRACKS, [artistOf])), ids(sortByKey(TRACKS, artistOf)));
  eq(ids(multiPass(TRACKS, [artistOf])), ids(sortByKey(TRACKS, artistOf)));
});

test('a compound sort ties only when every key ties', () => {
  const rows = [
    { id: 'x', a: 1, b: 2 },
    { id: 'y', a: 1, b: 1 },
    { id: 'z', a: 1, b: 2 },
  ];
  eq(ids(compound(rows, [(r) => r.a, (r) => r.b])), ['y', 'x', 'z']);
});

test('an empty list sorts to an empty list', () => {
  eq(sortByKey([], playsOf), []);
  eq(multiPass([], [playsOf]), []);
  eq(compound([], [playsOf]), []);
});
