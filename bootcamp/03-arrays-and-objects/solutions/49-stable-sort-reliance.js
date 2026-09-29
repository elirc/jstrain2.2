// ─────────────────────────────────────────────────────────────────────────
//  49 · leaning on a stable sort — SOLUTION                ★★☆ core
//  run: node 49-stable-sort-reliance.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `multiPass` is `reduceRight` over the key functions — last
//  key sorted first, so the most significant key runs last and wins, while
//  stability protects every earlier pass inside the ties. `compound` says
//  the same thing in one comparator: try each key, return the first
//  non-zero, fall through to 0 when all agree. Both are worth knowing.
//  Multi-pass is how you sort a table when the user clicks a second column
//  header and you only have the previous order to work from; the compound
//  comparator is what you write when you know all the keys up front, and it
//  is one pass instead of k. The wrong-order test is the lesson: run the
//  passes most-significant-first and the last pass shreds everything the
//  earlier ones did. Before ES2019 none of this was safe — V8 used an
//  unstable quicksort for arrays over 10 elements, which is why old code is
//  full of hand-written compound comparators.

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

const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

export function sortByKey(items, keyOf) {
  return items.toSorted((a, b) => compare(keyOf(a), keyOf(b)));
}

export function multiPass(items, keyFns) {
  return keyFns.reduceRight((sorted, keyOf) => sortByKey(sorted, keyOf), items);
}

export function compound(items, keyFns) {
  return items.toSorted((a, b) => {
    for (const keyOf of keyFns) {
      const order = compare(keyOf(a), keyOf(b));
      if (order !== 0) return order;
    }
    return 0;
  });
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
