// ─────────────────────────────────────────────────────────────────────────
//  02 · nextState — SOLUTION                                ★☆☆ warm-up
//  run: node 02-next-state.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: one switch, one `{ ...state, changedKey }` per branch. The
//  spread copies every field you are not touching, so the function stays
//  correct when someone adds a field later.
//  The interesting rule is the default branch: returning `state` itself
//  (not `{ ...state }`) means callers can ask "did anything change?" with a
//  cheap `prev === next`. That identity check is what lets React skip a
//  re-render and what lets a cache stay valid — copying on every event
//  quietly destroys it.

import { test, eq, ok } from '../../_lib/check.js';

const state = Object.freeze({ name: 'Ada', hp: 80, score: 120 });

export function nextState(state, event) {
  switch (event.type) {
    case 'damage':
      return { ...state, hp: Math.max(0, state.hp - event.amount) };
    case 'heal':
      return { ...state, hp: Math.min(100, state.hp + event.amount) };
    case 'score':
      return { ...state, score: state.score + event.points };
    case 'rename':
      return { ...state, name: event.name };
    default:
      return state;
  }
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
