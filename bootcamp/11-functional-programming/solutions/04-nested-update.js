// ─────────────────────────────────────────────────────────────────────────
//  04 · nested immutable update — SOLUTION                  ★★☆ core
//  run: node 04-nested-update.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: setTheme is the hand-written version — one spread per
//  level, nested inside each other. Write it once and you can see the
//  shape: at every level you copy that object and replace exactly one key.
//  setIn is the same idea with recursion instead of typing: peel the head
//  off the path, copy this level, recurse into the tail. The base case
//  (empty path) returns the value itself, which is what makes the
//  recursion bottom out cleanly.
//  updateIn is not new code — walk the path to read the current value,
//  then hand setIn the result of fn. Building the general tool out of the
//  specific one is the whole game in this module.

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
  return {
    ...settings,
    profile: {
      ...settings.profile,
      display: { ...settings.profile.display, theme },
    },
  };
}

export function setIn(obj, path, value) {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  return { ...obj, [head]: setIn(obj?.[head] ?? {}, rest, value) };
}

export function updateIn(obj, path, fn) {
  const current = path.reduce((node, key) => node?.[key], obj);
  return setIn(obj, path, fn(current));
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
