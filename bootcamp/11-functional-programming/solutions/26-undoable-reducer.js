// ─────────────────────────────────────────────────────────────────────────
//  26 · an undoable reducer — SOLUTION                       ★★★ stretch
//  run: node 26-undoable-reducer.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `undoable` is a reducer that takes a reducer — it handles
//  exactly two action types itself and delegates literally everything else.
//  The inner reducer stays a plain (state, action) => state and has no idea
//  it is being recorded, which is why you can wrap any reducer you already
//  have.
//  Three details decide whether this is pleasant to use:
//  · `next === present` means "the reducer ignored that", so return the
//    SAME history object. Skip this and every stray keypress becomes an
//    undo step, and the user has to press Ctrl-Z nine times to see a
//    change. This only works because reducers return their input when
//    they have nothing to do — identity is the change signal.
//  · a real action CLEARS future. You have branched off the redo timeline;
//    keeping it would let redo jump to a state that never followed this
//    one.
//  · past/future are rebuilt with slice and spread. `past.pop()` would
//    mutate the array the previous state is still holding — and the
//    previous state is the whole point of an undo stack.
//  Classic wrong turn: `present: past.pop()` — it "works" once, then the
//  earlier history object you handed to React has silently changed too.

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
  return { past: [], present, future: [] };
}

export function undoable(reducer) {
  return (state, action) => {
    const { past, present, future } = state;

    if (action.type === 'UNDO') {
      if (past.length === 0) return state;
      return {
        past: past.slice(0, -1),
        present: past.at(-1),
        future: [present, ...future],
      };
    }

    if (action.type === 'REDO') {
      if (future.length === 0) return state;
      return {
        past: [...past, present],
        present: future[0],
        future: future.slice(1),
      };
    }

    const next = reducer(present, action);
    if (next === present) return state;
    return { past: [...past, present], present: next, future: [] };
  };
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
