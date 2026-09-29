// ─────────────────────────────────────────────────────────────────────────
//  39 · parameter combos — SOLUTION                             ★★☆ core
//  run: node 39-param-combos.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: parameter defaults are expressions, evaluated left to
//  right when the call happens — not once when the function is defined.
//  That is why `prefix = name.toUpperCase()` can see `name`, why the
//  reverse throws a TDZ ReferenceError, and why `list = []` hands out a
//  brand new array on every call. (Python's mutable default argument bug
//  simply does not exist here.)
//
//  `{ sep = ':' } = {}` is two defaults doing two jobs: the inner one
//  supplies the separator, the outer one keeps a missing options argument
//  from throwing when the pattern tries to destructure undefined.
//
//  fn.length stops counting at the first default or rest parameter, so
//  keeping the defaults in the signature is observable — 1 here, not 3.
//  Libraries that dispatch on arity (Express error handlers, reduce
//  callbacks) really do read it.

import { test, eq, ok, throws } from '../../_lib/check.js';

export function makeLabel(
  name,
  prefix = name.toUpperCase(),
  { sep = ':' } = {},
  ...extras
) {
  return [prefix, name, ...extras].join(sep);
}

export function arity(fn) {
  return fn.length;
}

export function pushTo(item, list = []) {
  list.push(item);
  return list;
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
