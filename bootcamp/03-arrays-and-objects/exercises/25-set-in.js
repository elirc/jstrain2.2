// ─────────────────────────────────────────────────────────────────────────
//  25 · nested immutable update                            ★★★ stretch
//  concepts: paths · structural sharing · recursion
//  run: node 25-set-in.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Every Redux reducer and every `setState` on nested data is this
//  function. Read a value at a path, and write one WITHOUT mutating
//  anything — copying only the objects along the path and sharing the rest.
//
//      getIn(STATE, ['user', 'prefs', 'theme'])         → 'dark'
//      getIn(STATE, ['user', 'avatar', 'url'], null)    → null
//      setIn(STATE, ['user', 'prefs', 'theme'], 'light')
//        → new state, theme 'light', STATE unchanged, todos shared
//
//  STATE is deeply frozen, so any mutation throws. Numeric path segments
//  address array indexes, and arrays must stay arrays.
//
//  hint: recursion — `setIn(node, [first, ...rest], value)` copies `node`
//  and puts `setIn(node[first], rest, value)` at `first`. An empty path
//  means "you are at the target".

import { test, eq, ok } from '../../_lib/check.js';

const deepFreeze = (value) => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
  }
  return Object.freeze(value);
};

const STATE = deepFreeze({
  user: { name: 'Ada', prefs: { theme: 'dark', lang: 'en' } },
  todos: [
    { id: 1, done: false },
    { id: 2, done: false },
  ],
});

export function getIn(obj, path, fallback = undefined) {
  throw new Error('TODO');
}

export function setIn(obj, path, value) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('getIn reads a value three levels down', () => {
  eq(getIn(STATE, ['user', 'prefs', 'theme']), 'dark');
});

test('getIn returns the fallback when the path breaks', () => {
  eq(getIn(STATE, ['user', 'avatar', 'url'], null), null);
  eq(getIn(STATE, ['nope'], 'x'), 'x');
});

test('getIn with an empty path returns the object itself', () => {
  ok(getIn(STATE, []) === STATE);
});

test('setIn writes the new value at the path', () => {
  const next = setIn(STATE, ['user', 'prefs', 'theme'], 'light');
  eq(next.user.prefs.theme, 'light');
  eq(next.user.prefs.lang, 'en');
});

test('setIn leaves the frozen original untouched', () => {
  setIn(STATE, ['user', 'prefs', 'theme'], 'light');
  eq(STATE.user.prefs.theme, 'dark');
});

test('setIn copies every object on the path', () => {
  const next = setIn(STATE, ['user', 'prefs', 'theme'], 'light');
  ok(next !== STATE);
  ok(next.user !== STATE.user);
  ok(next.user.prefs !== STATE.user.prefs);
});

test('setIn shares the branches it did not touch', () => {
  const next = setIn(STATE, ['user', 'prefs', 'theme'], 'light');
  ok(next.todos === STATE.todos);
});

test('setIn walks into arrays and keeps them arrays', () => {
  const next = setIn(STATE, ['todos', 0, 'done'], true);
  ok(Array.isArray(next.todos));
  eq(next.todos[0], { id: 1, done: true });
  eq(STATE.todos[0].done, false);
  ok(next.todos[1] === STATE.todos[1]);
});
