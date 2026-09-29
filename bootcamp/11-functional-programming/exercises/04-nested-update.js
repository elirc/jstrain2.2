// ─────────────────────────────────────────────────────────────────────────
//  04 · nested immutable update                             ★★☆ core
//  concepts: immutability · recursion · structural sharing
//  run: node 04-nested-update.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Settings objects are always three levels deep, and every junior writes
//  `settings.profile.display.theme = 'light'` at least once. Do it right:
//  copy every object ON the path, share every object OFF the path.
//
//      setTheme(settings, 'light')
//        → profile.display.theme is 'light'
//        → settings.notifications is the SAME object as before
//
//      setIn(obj, ['a', 'b'], 9)          → { ...obj, a: { ...obj.a, b: 9 } }
//      setIn(obj, [], 9)                  → 9
//      updateIn(obj, ['a', 'b'], (n) => n + 1)
//
//  setIn walks a path of keys; if a step is missing it creates a plain
//  object there. updateIn is setIn with a function of the current value.
//
//  hint: setIn is three lines if you let it call itself.

import { test, eq, ok } from '../../_lib/check.js';

const deepFreeze = (value) => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
  }
  return Object.freeze(value);
};

const settings = deepFreeze({
  profile: {
    name: 'Ada',
    display: { theme: 'dark', density: 'cozy' },
  },
  notifications: {
    email: { marketing: false, security: true },
  },
});

export function setTheme(settings, theme) {
  throw new Error('TODO');
}

export function setIn(obj, path, value) {
  throw new Error('TODO');
}

export function updateIn(obj, path, fn) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('setTheme changes the value three levels down', () => {
  eq(setTheme(settings, 'light').profile.display.theme, 'light');
});

test('setTheme keeps the siblings on the path', () => {
  const next = setTheme(settings, 'light');
  eq(next.profile.display.density, 'cozy');
  eq(next.profile.name, 'Ada');
});

test('setTheme shares the branches it did not visit', () => {
  const next = setTheme(settings, 'light');
  ok(next.notifications === settings.notifications, 'off-path branch reused');
  ok(next.profile !== settings.profile, 'on-path branch copied');
});

test('setTheme leaves the frozen original alone', () => {
  setTheme(settings, 'light');
  eq(settings.profile.display.theme, 'dark');
});

test('setIn rebuilds every object along the path', () => {
  const next = setIn(settings, ['notifications', 'email', 'marketing'], true);
  eq(next.notifications.email.marketing, true);
  eq(next.notifications.email.security, true);
  ok(next.profile === settings.profile, 'other branches are shared');
});

test('setIn creates a missing step as a plain object', () => {
  eq(setIn({ a: 1 }, ['b', 'c'], 2), { a: 1, b: { c: 2 } });
});

test('setIn with an empty path is just the new value', () => {
  eq(setIn({ a: 1 }, [], 'replaced'), 'replaced');
});

test('updateIn applies a function to what is already there', () => {
  const next = updateIn(settings, ['profile', 'name'], (n) => n.toUpperCase());
  eq(next.profile.name, 'ADA');
  eq(settings.profile.name, 'Ada');
});
