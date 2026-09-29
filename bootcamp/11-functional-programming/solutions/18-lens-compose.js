// ─────────────────────────────────────────────────────────────────────────
//  18 · lenses, part 2 — composing — SOLUTION                ★★★ stretch
//  run: node 18-lens-compose.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the getter half is obvious — read outward-in. The setter
//  is the interesting one, and it is where every hand-rolled deep update
//  goes wrong. To write a value deep inside, you must first READ the outer
//  value, produce a new inner-updated version of it, and then SET that new
//  value back through the outer lens. Three moves, one line:
//      outer.set(inner.set(value, outer.get(target)), target)
//  Because each level's setter copies only its own level, everything you
//  did not walk through comes back by reference — that is structural
//  sharing, and it is what makes `prev !== next` a cheap change signal.
//  `lensPath` is then just a fold: turn each key into a one-level lens and
//  reduce them together with composeLens, seeded with the identity lens so
//  that a zero-key path is still a valid lens.
//  Classic wrong turn: `outer.set(inner.set(value, target), target)` —
//  passing the WHOLE target to the inner lens instead of the outer value.
//  It type-checks, runs, and quietly writes the key at the wrong level.

import { test, eq, ok } from '../../_lib/check.js';

const deepFreeze = (value) => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
  }
  return Object.freeze(value);
};

const state = deepFreeze({
  user: { profile: { city: 'London', theme: 'dark' }, id: 7 },
  tags: ['fp', 'js'],
  cart: { lines: [{ sku: 'mug', qty: 1 }, { sku: 'pen', qty: 2 }] },
});

// ── given: the part-1 toolkit ────────────────────────────────────────────

const lens = (getter, setter) => ({ get: getter, set: setter });
const view = (lens, target) => lens.get(target);
const set = (lens, value, target) => lens.set(value, target);
const over = (lens, fn, target) => lens.set(fn(lens.get(target)), target);
const lensProp = (key) =>
  lens(
    (target) => target[key],
    (value, target) => ({ ...target, [key]: value })
  );
const lensIndex = (index) =>
  lens(
    (target) => target[index],
    (value, target) => target.map((item, i) => (i === index ? value : item))
  );

export function composeLens(outer, inner) {
  return lens(
    (target) => inner.get(outer.get(target)),
    (value, target) => outer.set(inner.set(value, outer.get(target)), target)
  );
}

export function lensPath(...keys) {
  const identity = lens(
    (target) => target,
    (value) => value
  );
  const at = (key) =>
    typeof key === 'number' ? lensIndex(key) : lensProp(key);
  return keys.map(at).reduce(composeLens, identity);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a composed lens reads two levels down', () => {
  const theme = composeLens(lensProp('user'), lensProp('profile'));
  eq(view(theme, state), { city: 'London', theme: 'dark' });
});

test('setting through a composed lens rebuilds both levels', () => {
  const id = composeLens(lensProp('user'), lensProp('id'));
  const next = set(id, 8, state);
  eq(next.user.id, 8);
  eq(state.user.id, 7);
  ok(next.user !== state.user, 'the spine is copied');
});

test('over works through a composed lens', () => {
  const id = composeLens(lensProp('user'), lensProp('id'));
  eq(over(id, (n) => n * 10, state).user.id, 70);
});

test('lensPath walks as many segments as you give it', () => {
  const city = lensPath('user', 'profile', 'city');
  eq(view(city, state), 'London');
  eq(set(city, 'Paris', state).user.profile.city, 'Paris');
  eq(state.user.profile.city, 'London');
});

test('a number in the path means an array index', () => {
  const qty = lensPath('cart', 'lines', 1, 'qty');
  eq(view(qty, state), 2);
  eq(view(qty, over(qty, (n) => n + 5, state)), 7);
});

test('everything the path did not touch keeps its identity', () => {
  const next = set(lensPath('user', 'profile', 'city'), 'Paris', state);
  ok(next.tags === state.tags, 'sibling branch shared');
  ok(next.cart === state.cart, 'sibling branch shared');
  ok(next.user.profile !== state.user.profile, 'the spine is fresh');
});

test('deep in an array, untouched items are shared', () => {
  const next = set(lensPath('cart', 'lines', 1, 'qty'), 9, state);
  ok(next.cart.lines[0] === state.cart.lines[0], 'line 0 untouched');
  ok(next.cart.lines[1] !== state.cart.lines[1], 'line 1 replaced');
  eq(next.cart.lines[1], { sku: 'pen', qty: 9 });
});

test('a one-key path is the plain prop lens, an empty one the identity', () => {
  eq(view(lensPath('tags'), state), ['fp', 'js']);
  eq(view(lensPath(), state), state);
  eq(set(lensPath(), 'replaced', state), 'replaced');
});
