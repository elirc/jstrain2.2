// ─────────────────────────────────────────────────────────────────────────
//  39 · parameter combos                                        ★★☆ core
//  concepts: default params · destructured params · rest · fn.length
//  run: node 39-param-combos.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Signatures can mix all four styles at once, and the defaults are real
//  expressions evaluated left to right at call time — so a later default
//  may use an earlier parameter.
//
//  makeLabel(name, prefix = name.toUpperCase(), { sep = ':' } = {},
//  ...extras) joins prefix, name and the extras with the separator:
//
//      makeLabel('api')                          → 'API:api'
//      makeLabel('api', 'svc')                   → 'svc:api'
//      makeLabel('api', undefined, { sep: '/' }) → 'API/api'
//      makeLabel('api', 'svc', {}, 'v2', 'eu')   → 'svc:api:v2:eu'
//
//  Every default belongs in the PARAMETER LIST, not in the body — so
//  `arity(makeLabel)` (which is fn.length) must be 1.
//
//      arity((a, b) => 0)      → 2      arity((a, b = 1) => 0) → 1
//      arity((a, ...rest) => 0) → 1     arity(({ a }, b) => 0) → 2
//
//  pushTo(item, list = []) pushes and returns the list — a FRESH one each
//  call when none is given:
//
//      pushTo(1)   → [1]        pushTo(2)   → [2]   (not [1, 2])
//
//  hint: a rest parameter has to come last, but an options object may sit
//  in front of it. `fn.length` counts the parameters BEFORE the first one
//  with a default or a rest.

import { test, eq, ok, throws } from '../../_lib/check.js';

export function makeLabel(name, prefix, options, ...extras) {
  throw new Error('TODO');
}

export function arity(fn) {
  throw new Error('TODO');
}

export function pushTo(item, list) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the prefix defaults to the name, shouted', () => {
  eq(makeLabel('api'), 'API:api');
  eq(makeLabel('users'), 'USERS:users');
  eq(makeLabel('api', 'svc'), 'svc:api');
});

test('an explicit undefined takes the default; null does not', () => {
  eq(makeLabel('api', undefined), 'API:api');
  eq(makeLabel('api', null), ':api');
});

test('the options object and its separator are both optional', () => {
  eq(makeLabel('api', 'svc', { sep: '/' }), 'svc/api');
  eq(makeLabel('api', 'svc', {}), 'svc:api');
  eq(makeLabel('api', 'svc', undefined), 'svc:api');
  eq(makeLabel('api', undefined, { sep: '.' }), 'API.api');
});

test('extras land at the end, joined with the same separator', () => {
  eq(makeLabel('api', 'svc', {}, 'v2', 'eu'), 'svc:api:v2:eu');
  eq(makeLabel('api', 'svc', { sep: '-' }, 'v2'), 'svc-api-v2');
  eq(makeLabel('api', undefined, undefined, 'v2'), 'API:api:v2');
});

test('a default may read an earlier parameter, never a later one', () => {
  eq(makeLabel('api'), 'API:api');
  throws(() => ((a = b, b = 1) => a)(), 'before initialization');
  eq(((a, b = a + 1) => b)(1), 2);
});

test('arity counts the parameters before the first default or rest', () => {
  eq(arity((a, b) => 0), 2);
  eq(arity((a, b = 1) => 0), 1);
  eq(arity((a, ...rest) => 0), 1);
  eq(arity((...all) => 0), 0);
  eq(arity(({ a }, b) => 0), 2);
});

test('the defaults live in the signature, so the arity is 1', () => {
  eq(arity(makeLabel), 1);
  eq(arity(pushTo), 1);
});

test('pushTo builds a fresh list every call, and reuses one you pass', () => {
  eq(pushTo(1), [1]);
  eq(pushTo(2), [2]);
  const list = [];
  ok(pushTo('a', list) === list, 'returns the very list it was given');
  pushTo('b', list);
  eq(list, ['a', 'b']);
});
