// ─────────────────────────────────────────────────────────────────────────
//  19 · produce — an immer in 25 lines                       ★★★ stretch
//  concepts: structural sharing · recursion · copy-on-write
//  run: node 19-produce-immer-lite.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Immutable updates read badly the deeper they go. Immer's trick is to let
//  you WRITE mutable code and hand you an immutable result. Build the tiny
//  version: copy, let the recipe scribble on the copy, then diff the copy
//  against the original and keep every branch that did not actually change.
//
//      const next = produce(state, (draft) => {
//        draft.user.theme = 'light';
//        draft.cart.lines.push({ sku: 'ink', qty: 1 });
//      });
//      next !== state          next.tags === state.tags   (shared!)
//
//  The contract, exactly:
//    · the recipe gets a deep, MUTABLE copy — assign, push, delete freely
//    · the base is never touched, at any depth
//    · a recipe that changed nothing returns the base ITSELF (===)
//    · every branch the recipe did not change comes back by reference
//    · scope: plain objects and arrays. Anything else (numbers, strings,
//      Dates, class instances) is carried across by reference and compared
//      with ===. The recipe's return value is ignored.
//
//  hint: two recursive helpers — one that copies, one that walks base and
//  draft together and answers "is this subtree still the old one?".

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

export function produce(base, recipe) {
  throw new Error('TODO');
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
