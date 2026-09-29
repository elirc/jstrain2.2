// ─────────────────────────────────────────────────────────────────────────
//  18 · options objects                                         ★★☆ core
//  concepts: parameter destructuring · rest in objects · defaults
//  run: node 18-param-destructuring.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The options-object pattern: one argument, named fields, defaults in
//  the signature. Destructure it in the PARAMETER LIST and collect
//  anything you did not name into `extras`.
//
//      createRequest({ url: '/a' })
//      → { url: '/a', method: 'GET', headers: {}, extras: {} }
//
//      createRequest({ url: '/a', method: 'POST', retries: 2 })
//      → { url: '/a', method: 'POST', headers: {},
//          extras: { retries: 2 } }
//
//      createRequest()          // must not throw
//      → { url: undefined, method: 'GET', headers: {}, extras: {} }
//
//  hint: `function f({ a = 1, ...rest } = {})` — the outer `= {}` is
//  what keeps `f()` from throwing on a missing argument.

import { test, eq, ok } from '../../_lib/check.js';

export function createRequest(options) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('fills in the method and headers defaults', () => {
  eq(createRequest({ url: '/a' }), {
    url: '/a',
    method: 'GET',
    headers: {},
    extras: {},
  });
});

test('survives being called with no argument at all', () => {
  eq(createRequest(), {
    url: undefined,
    method: 'GET',
    headers: {},
    extras: {},
  });
});

test('keeps the values that were provided', () => {
  const headers = { accept: 'json' };
  const result = createRequest({ url: '/b', method: 'POST', headers });
  eq(result.method, 'POST');
  eq(result.headers, { accept: 'json' });
  ok(result.headers === headers, 'headers is passed through, not copied');
});

test('collects unknown options into extras', () => {
  eq(createRequest({ url: '/c', retries: 2, timeout: 50 }).extras, {
    retries: 2,
    timeout: 50,
  });
});

test('the named options never leak into extras', () => {
  const result = createRequest({ url: '/d', method: 'PUT', headers: {} });
  eq(Object.keys(result.extras), []);
});

test('an explicit undefined takes the default, null does not', () => {
  eq(createRequest({ method: undefined }).method, 'GET');
  eq(createRequest({ method: null }).method, null);
  eq(createRequest({ headers: null }).headers, null);
});
