// ─────────────────────────────────────────────────────────────────────────
//  17 · lenses, part 1 — SOLUTION                            ★★★ stretch
//  run: node 17-lens-basics.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `lens` is nothing but a pair — a getter and an immutable
//  setter travelling together. The whole payoff is that once the pair
//  exists, `view`, `set` and `over` never need to know WHERE the value
//  lives; they just call the two functions. That is why `lensProp` and
//  `lensIndex` are one-liners: each supplies the two halves for its own
//  kind of container, and the copying discipline (`{ ...target }`,
//  `[...target]`) lives in exactly one place instead of at every call site.
//  `over` is the piece worth staring at — it is `set(l, fn(view(l, t)), t)`
//  and nothing else, which is why a lens gives you three verbs for the
//  price of two functions.
//  Classic wrong turn: writing a setter that mutates and returns the same
//  target (`target[key] = value; return target`). Every test still passes
//  on unfrozen data, and then the frozen fixture throws — which is the
//  point of freezing it.

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
  return { get: getter, set: setter };
}

export function view(lens, target) {
  return lens.get(target);
}

export function set(lens, value, target) {
  return lens.set(value, target);
}

export function over(lens, fn, target) {
  return lens.set(fn(lens.get(target)), target);
}

export function lensProp(key) {
  return lens(
    (target) => target[key],
    (value, target) => ({ ...target, [key]: value })
  );
}

export function lensIndex(index) {
  return lens(
    (target) => target[index],
    (value, target) => target.map((item, i) => (i === index ? value : item))
  );
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
