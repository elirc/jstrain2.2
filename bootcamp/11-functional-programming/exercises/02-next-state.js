// ─────────────────────────────────────────────────────────────────────────
//  02 · nextState                                           ★☆☆ warm-up
//  concepts: purity · state transitions · reference identity
//  run: node 02-next-state.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A game loop used to poke the player object directly: `player.hp -= 10`.
//  Replace it with one pure transition function. Same shape in, a NEW
//  shape out — this is the exact contract every reducer in Redux, useState
//  or an event-sourced backend signs.
//
//      state = { name: 'Ada', hp: 80, score: 120 }
//
//      nextState(state, { type: 'damage', amount: 30 }) → hp 50
//      nextState(state, { type: 'heal',   amount: 50 }) → hp 100 (capped)
//      nextState(state, { type: 'score',  points: 5 })  → score 125
//      nextState(state, { type: 'rename', name: 'Bo' }) → name 'Bo'
//
//  hp floors at 0 and caps at 100. An event type you do not know changes
//  nothing — return the SAME state object, not a copy of it.

import { test, eq, ok } from '../../_lib/check.js';

const state = Object.freeze({ name: 'Ada', hp: 80, score: 120 });

export function nextState(state, event) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('damage subtracts from hp and returns a new object', () => {
  const next = nextState(state, { type: 'damage', amount: 30 });
  eq(next.hp, 50);
  ok(next !== state, 'a change must produce a new object');
});

test('hp never drops below 0', () => {
  eq(nextState(state, { type: 'damage', amount: 999 }).hp, 0);
});

test('healing is capped at 100', () => {
  eq(nextState(state, { type: 'heal', amount: 50 }).hp, 100);
});

test('score adds points and leaves hp alone', () => {
  const next = nextState(state, { type: 'score', points: 5 });
  eq(next.score, 125);
  eq(next.hp, 80);
});

test('rename replaces only the name', () => {
  eq(nextState(state, { type: 'rename', name: 'Bo' }), {
    name: 'Bo',
    hp: 80,
    score: 120,
  });
});

test('the input state is never mutated', () => {
  nextState(state, { type: 'damage', amount: 30 });
  nextState(state, { type: 'score', points: 5 });
  eq(state, { name: 'Ada', hp: 80, score: 120 });
});

test('an unknown event returns the very same state object', () => {
  const next = nextState(state, { type: 'sneeze' });
  ok(next === state, 'no change means no new object');
});
