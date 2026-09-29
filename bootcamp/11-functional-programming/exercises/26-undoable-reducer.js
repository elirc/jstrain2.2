// ─────────────────────────────────────────────────────────────────────────
//  26 · an undoable reducer                                  ★★★ stretch
//  concepts: reducers · higher-order functions · immutable history
//  run: node 26-undoable-reducer.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Undo is the payoff for never mutating. If every state is a value that
//  outlives the next one, "go back" is just "keep the old one and use it
//  again" — so undo/redo is a WRAPPER around a reducer, and the reducer
//  underneath never learns that history exists.
//
//      const history = undoable(counter);
//      let state = initialHistory({ count: 0 });
//      state = history(state, { type: 'add', by: 3 });   // present 3
//      state = history(state, { type: 'UNDO' });         // present 0
//      state = history(state, { type: 'REDO' });         // present 3
//
//  The state is { past: [...], present, future: [...] }, oldest first.
//
//    UNDO   present → front of future, last of past → present
//    REDO   the mirror image
//    other  next = reducer(present, action)
//           · next === present (the reducer ignored it) → return the SAME
//             history object; a no-op must not fill up the undo stack
//           · otherwise push present onto past, and CLEAR future — you
//             have branched away from the redo timeline
//    UNDO with nothing to undo (or REDO with nothing to redo) returns the
//    same history object too.
//
//  hint: `past.at(-1)` and `past.slice(0, -1)` — no pop, no splice.

import { test, eq, ok } from '../../_lib/check.js';

const deepFreeze = (value) => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
  }
  return Object.freeze(value);
};

// ── given: an ordinary, history-free reducer ─────────────────────────────

const counter = (state, action) => {
  switch (action.type) {
    case 'add':
      return { count: state.count + action.by };
    case 'reset':
      return state.count === 0 ? state : { count: 0 };
    default:
      return state;
  }
};

const add = (by) => ({ type: 'add', by });
const UNDO = { type: 'UNDO' };
const REDO = { type: 'REDO' };

export function initialHistory(present) {
  throw new Error('TODO');
}

export function undoable(reducer) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('initialHistory wraps a starting value', () => {
  eq(initialHistory({ count: 0 }), {
    past: [],
    present: { count: 0 },
    future: [],
  });
});

test('an ordinary action pushes the old present onto past', () => {
  const history = undoable(counter);
  const next = history(deepFreeze(initialHistory({ count: 0 })), add(3));
  eq(next, { past: [{ count: 0 }], present: { count: 3 }, future: [] });
});

test('undo steps back and remembers what it undid', () => {
  const history = undoable(counter);
  const one = history(initialHistory({ count: 0 }), add(3));
  const back = history(deepFreeze(one), UNDO);
  eq(back, { past: [], present: { count: 0 }, future: [{ count: 3 }] });
});

test('redo replays the undone state', () => {
  const history = undoable(counter);
  const one = history(initialHistory({ count: 0 }), add(3));
  const forward = history(history(one, UNDO), REDO);
  eq(forward, { past: [{ count: 0 }], present: { count: 3 }, future: [] });
});

test('several steps unwind in order', () => {
  const history = undoable(counter);
  let state = initialHistory({ count: 0 });
  state = history(state, add(1));
  state = history(state, add(10));
  eq(state.past, [{ count: 0 }, { count: 1 }]);
  state = history(state, UNDO);
  eq(state.present, { count: 1 });
  state = history(state, UNDO);
  eq(state.present, { count: 0 });
  eq(state.future, [{ count: 1 }, { count: 11 }]);
});

test('undo with nothing to undo is the same state object', () => {
  const history = undoable(counter);
  const start = deepFreeze(initialHistory({ count: 0 }));
  ok(history(start, UNDO) === start, 'no undo');
  ok(history(start, REDO) === start, 'no redo');
});

test('a new action after an undo clears the redo future', () => {
  const history = undoable(counter);
  let state = initialHistory({ count: 0 });
  state = history(state, add(1));
  state = history(state, UNDO);
  eq(state.future.length, 1);
  state = history(state, add(5));
  eq(state.future, [], 'the old timeline is gone');
  eq(state.present, { count: 5 });
  eq(state.past, [{ count: 0 }]);
});

test('an action the reducer ignores does not grow the history', () => {
  const history = undoable(counter);
  const start = deepFreeze(initialHistory({ count: 0 }));
  ok(history(start, { type: 'unknown' }) === start, 'nothing happened');
  ok(history(start, { type: 'reset' }) === start, 'already 0');
  eq(history(start, add(0)).past.length, 1, 'a real new value still counts');
});
