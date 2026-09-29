// ─────────────────────────────────────────────────────────────────────────
//  07 · seeded randomness                                       ★★☆ core
//  concepts: PRNGs · determinism · bit twiddling
//  run: node 07-seeded-random.js
// ─────────────────────────────────────────────────────────────────────────
//
//  "Randomly assign a variant", "shuffle the deck", "pick a retry jitter" —
//  all untestable while they call Math.random(). Inject the randomness and
//  a seed makes the whole thing replayable.
//
//      const rng = makeRandom(42);
//      rng.next()                → 0.6011037519201636   (float in [0,1))
//      rng.int(1, 6)             → 4                    (both ends included)
//      rng.pick(['a','b','c'])   → 'b'
//      rng.shuffle([1,2,3,4])    → [3,1,4,2]  (a NEW array; input untouched)
//
//      makeRandom(42).next() === makeRandom(42).next()      // always
//
//  next() is mulberry32 — copy the algorithm, the bit operators are what
//  keep it inside 32 bits:
//
//      state |= 0;  state = (state + 0x6d2b79f5) | 0;
//      let t = Math.imul(state ^ (state >>> 15), 1 | state);
//      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
//      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
//
//  Build the rest on next(), exactly like this so your sequences match:
//      int(min,max) = min + floor(next() * (max - min + 1))
//      pick(list)   = list[floor(next() * list.length)]
//      shuffle      = Fisher-Yates from the END: for i = len-1 down to 1,
//                     swap out[i] with out[int(0, i)]
//
//  hint: `state` lives in the closure. Every helper must advance it by
//  calling next() — reading it directly gives the same value twice.

import { test, eq, ok } from '../../_lib/check.js';

export function makeRandom(seed) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('next() returns floats in [0, 1)', () => {
  const rng = makeRandom(42);
  for (let i = 0; i < 200; i++) {
    const v = rng.next();
    ok(typeof v === 'number' && v >= 0 && v < 1, `out of range: ${v}`);
  }
});

test('the same seed replays the same sequence', () => {
  const a = makeRandom(7);
  const b = makeRandom(7);
  const first = Array.from({ length: 8 }, () => a.next());
  const second = Array.from({ length: 8 }, () => b.next());
  eq(first, second);
  ok(new Set(first).size > 1, 'the sequence should not be constant');
});

test('different seeds give different sequences', () => {
  const a = makeRandom(1);
  const b = makeRandom(2);
  const left = Array.from({ length: 5 }, () => a.next());
  const right = Array.from({ length: 5 }, () => b.next());
  ok(left.some((v, i) => v !== right[i]), 'seeds 1 and 2 should differ');
});

test('int(min, max) stays in range and reaches both ends', () => {
  const rng = makeRandom(99);
  const seen = new Set();
  for (let i = 0; i < 500; i++) {
    const v = rng.int(1, 6);
    ok(Number.isInteger(v) && v >= 1 && v <= 6, `out of range: ${v}`);
    seen.add(v);
  }
  eq([...seen].sort(), [1, 2, 3, 4, 5, 6]);
});

test('int(n, n) is always n', () => {
  const rng = makeRandom(3);
  eq(Array.from({ length: 10 }, () => rng.int(5, 5)), Array(10).fill(5));
});

test('pick returns an element, and the same seed picks the same one', () => {
  const colours = ['red', 'green', 'blue', 'gold'];
  const a = makeRandom(12);
  const b = makeRandom(12);
  const picks = Array.from({ length: 6 }, () => a.pick(colours));
  eq(picks, Array.from({ length: 6 }, () => b.pick(colours)));
  ok(picks.every((p) => colours.includes(p)), 'every pick must be a colour');
});

test('shuffle returns a new array and leaves the input alone', () => {
  const deck = Array.from({ length: 20 }, (_, i) => i);
  const before = [...deck];
  const out = makeRandom(5).shuffle(deck);
  ok(out !== deck, 'shuffle must not return the same array');
  eq(deck, before);
  eq([...out].sort((x, y) => x - y), before);
});

test('the same seed gives the same permutation — and it really moves', () => {
  const deck = Array.from({ length: 30 }, (_, i) => i);
  const a = makeRandom(2024).shuffle(deck);
  const b = makeRandom(2024).shuffle(deck);
  eq(a, b);
  ok(a.some((v, i) => v !== deck[i]), 'a shuffle should reorder something');
});
