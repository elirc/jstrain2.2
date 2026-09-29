// ─────────────────────────────────────────────────────────────────────────
//  17 · lenses, part 1                                       ★★★ stretch
//  concepts: lenses · immutability · higher-order functions
//  run: node 17-lens-basics.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A lens is a first-class "place inside a value": a getter paired with an
//  immutable setter, bundled into one object you can pass around. Bundle
//  those two once and read / write / modify all come for free — and the
//  same three verbs work for a key, an array slot, or a value that is not
//  literally stored anywhere.
//
//      const name = lensProp('name');
//      view(name, user)                       → 'Ada'
//      set(name, 'Grace', user)               → a NEW user, old one intact
//      over(name, (s) => s.toUpperCase(), user)
//
//  Build:
//      lens(getter, setter)  → { get, set }
//          getter(target)         reads the focused value
//          setter(value, target)  returns a NEW target with it replaced
//      view(lens, target)          read
//      set(lens, value, target)    write
//      over(lens, fn, target)      modify
//      lensProp(key) / lensIndex(index)   built ON TOP of lens()
//
//  hint: `over` has no logic of its own — it is view, then fn, then set.

import { test, eq, ok } from '../../_lib/check.js';

const deepFreeze = (value) => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
  }
  return Object.freeze(value);
};

const user = deepFreeze({
  name: 'Ada',
  scores: [10, 20, 30],
  address: { city: 'London', zip: 'N1' },
});

export function lens(getter, setter) {
  throw new Error('TODO');
}

export function view(lens, target) {
  throw new Error('TODO');
}

export function set(lens, value, target) {
  throw new Error('TODO');
}

export function over(lens, fn, target) {
  throw new Error('TODO');
}

export function lensProp(key) {
  throw new Error('TODO');
}

export function lensIndex(index) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('view reads the focused value', () => {
  eq(view(lensProp('name'), user), 'Ada');
  eq(view(lensIndex(1), user.scores), 20);
});

test('set returns a new target and leaves the old one alone', () => {
  const next = set(lensProp('name'), 'Grace', user);
  eq(next.name, 'Grace');
  eq(user.name, 'Ada');
  ok(next !== user, 'a fresh object comes back');
});

test('set copies only the level it writes to', () => {
  const next = set(lensProp('name'), 'Grace', user);
  ok(next.address === user.address, 'siblings keep their identity');
});

test('over applies a function to the focused value', () => {
  eq(over(lensProp('name'), (s) => s.toUpperCase(), user).name, 'ADA');
  eq(user.name, 'Ada');
});

test('lensIndex copies the array instead of writing into it', () => {
  const next = set(lensIndex(0), 99, user.scores);
  eq(next, [99, 20, 30]);
  eq(user.scores, [10, 20, 30]);
  eq(over(lensIndex(2), (n) => n + 1, user.scores), [10, 20, 31]);
});

test('a hand-written lens can focus a value nothing stores', () => {
  const person = deepFreeze({ first: 'Ada', last: 'Lovelace', id: 7 });
  const fullName = lens(
    (p) => `${p.first} ${p.last}`,
    (value, p) => ({
      ...p,
      first: value.split(' ')[0],
      last: value.split(' ')[1],
    })
  );
  eq(view(fullName, person), 'Ada Lovelace');
  eq(set(fullName, 'Grace Hopper', person), {
    first: 'Grace',
    last: 'Hopper',
    id: 7,
  });
});

test('law: what you set is what you view', () => {
  const name = lensProp('name');
  eq(view(name, set(name, 'Grace', user)), 'Grace');
});

test('law: setting the current value back changes nothing', () => {
  const name = lensProp('name');
  eq(set(name, view(name, user), user), user);
});
