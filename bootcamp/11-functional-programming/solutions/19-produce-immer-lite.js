// ─────────────────────────────────────────────────────────────────────────
//  19 · produce — an immer in 25 lines — SOLUTION            ★★★ stretch
//  run: node 19-produce-immer-lite.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: split the job in two and each half is easy. `clone` makes a
//  deep, unfrozen playground so the recipe can be as mutable as it likes —
//  nothing it does can reach the base. `reconcile` then walks base and
//  draft together and answers one question per node: "did anything under
//  here actually change?" If not, it returns the BASE node, and the parent
//  sees an identical reference and can return its own base node too. That
//  single rule gives you both promised behaviours at once — untouched
//  branches are shared, and an all-no-op recipe returns the base itself.
//  The `same` flag has to check the key COUNT as well as each key, or a
//  deletion (fewer keys) and an addition (more keys) both slip through as
//  "unchanged".
//  Real immer records writes with a Proxy instead of copying up front, so
//  it never clones the parts you did not read; the structural-sharing rule
//  at the end is the same one you just wrote.
//  Classic wrong turn: returning the draft as-is. Every test about `===`
//  fails, and downstream `prev !== next` checks see everything as changed.

import { test, eq, ok } from '../../_lib/check.js';

const deepFreeze = (value) => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
  }
  return Object.freeze(value);
};

const state = deepFreeze({
  user: { name: 'Ada', theme: 'dark' },
  tags: ['fp', 'js'],
  cart: {
    code: 'SAVE10',
    lines: [
      { sku: 'mug', qty: 1 },
      { sku: 'pen', qty: 2 },
    ],
  },
});

const isPlain = (value) =>
  value !== null &&
  typeof value === 'object' &&
  (Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype);

const clone = (value) => {
  if (!isPlain(value)) return value;
  if (Array.isArray(value)) return value.map(clone);
  const out = {};
  for (const [key, child] of Object.entries(value)) out[key] = clone(child);
  return out;
};

const reconcile = (base, draft) => {
  if (base === draft) return base;
  if (!isPlain(base) || !isPlain(draft)) return draft;
  if (Array.isArray(base) !== Array.isArray(draft)) return draft;

  const keys = Object.keys(draft);
  const out = Array.isArray(draft) ? [] : {};
  let same = keys.length === Object.keys(base).length;
  for (const key of keys) {
    out[key] = reconcile(base[key], draft[key]);
    if (out[key] !== base[key]) same = false;
  }
  return same ? base : out;
};

export function produce(base, recipe) {
  const draft = clone(base);
  recipe(draft);
  return reconcile(base, draft);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a change comes back as a new state', () => {
  const next = produce(state, (draft) => {
    draft.user.theme = 'light';
  });
  eq(next.user.theme, 'light');
  ok(next !== state, 'a new root');
});

test('the frozen base is never touched', () => {
  produce(state, (draft) => {
    draft.user.theme = 'light';
    draft.cart.lines[0].qty = 99;
  });
  eq(state.user.theme, 'dark');
  eq(state.cart.lines[0].qty, 1);
});

test('untouched branches come back by reference', () => {
  const next = produce(state, (draft) => {
    draft.user.theme = 'light';
  });
  ok(next.tags === state.tags, 'tags shared');
  ok(next.cart === state.cart, 'cart shared');
  ok(next.user !== state.user, 'the changed branch is fresh');
});

test('a recipe that changes nothing hands the base straight back', () => {
  const next = produce(state, (draft) => draft.user.name.toUpperCase());
  ok(next === state, 'same object, no copy');
});

test('writing the same value back does not count as a change', () => {
  const next = produce(state, (draft) => {
    draft.user.theme = 'dark';
  });
  ok(next === state, 'equal values, so nothing changed');
});

test('push into a nested array shares the items it did not touch', () => {
  const next = produce(state, (draft) => {
    draft.cart.lines.push({ sku: 'ink', qty: 3 });
  });
  eq(next.cart.lines.length, 3);
  eq(state.cart.lines.length, 2);
  ok(next.cart.lines[0] === state.cart.lines[0], 'line 0 shared');
  ok(next.user === state.user, 'user branch shared');
});

test('delete removes a key from the copy only', () => {
  const next = produce(state, (draft) => {
    delete draft.cart.code;
  });
  eq('code' in next.cart, false);
  eq(state.cart.code, 'SAVE10');
  ok(next.cart.lines === state.cart.lines, 'the sibling array is shared');
});

test('only the spine down to the change is rebuilt', () => {
  const next = produce(state, (draft) => {
    draft.cart.lines[1].qty = 20;
  });
  ok(next.cart.lines[1] !== state.cart.lines[1], 'the changed item');
  ok(next.cart.lines[0] === state.cart.lines[0], 'its neighbour');
  ok(next.tags === state.tags, 'a whole different branch');
  eq(next.cart.lines[1], { sku: 'pen', qty: 20 });
});
