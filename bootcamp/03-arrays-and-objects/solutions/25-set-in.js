// ─────────────────────────────────────────────────────────────────────────
//  25 · nested immutable update — SOLUTION                 ★★★ stretch
//  run: node 25-set-in.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the base case `path.length === 0` returns the new value —
//  that is what makes the recursion terminate and what makes a one-segment
//  path work. On the way back up, each level copies only itself: spread for
//  objects, `slice()` for arrays (a spread of an array would work too, but
//  `{ ...array }` turns it into an object, which is the classic bug here).
//  Everything not on the path is shared by reference, so the update is
//  cheap and `prev.todos === next.todos` still tells React that branch did
//  not change. `getIn` is the boring half: walk the keys, bail out to the
//  fallback the moment you hit null or undefined.

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
  let current = obj;
  for (const key of path) {
    if (current === null || current === undefined) return fallback;
    current = current[key];
  }
  return current === undefined ? fallback : current;
}

export function setIn(obj, path, value) {
  if (path.length === 0) return value;
  const [key, ...rest] = path;
  const child = setIn(obj?.[key], rest, value);
  if (Array.isArray(obj)) {
    const copy = obj.slice();
    copy[key] = child;
    return copy;
  }
  return { ...obj, [key]: child };
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
