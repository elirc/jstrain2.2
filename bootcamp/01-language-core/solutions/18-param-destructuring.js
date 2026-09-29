// ─────────────────────────────────────────────────────────────────────────
//  18 · options objects — SOLUTION                              ★★☆ core
//  run: node 18-param-destructuring.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the whole function is a signature. Three things are
//  happening in it:
//
//  1. `{ ... } = {}` — the parameter default. Without it, calling with no
//     argument tries to destructure undefined and throws.
//  2. `method = 'GET'` — per-field defaults, which fire on undefined only.
//     `{ method: null }` therefore keeps null; if you want null handled,
//     that is a `??` in the body.
//  3. `...extras` — object rest. It collects the OWN enumerable keys that
//     were not named above, so adding a named option automatically
//     removes it from extras.
//
//  Note that `headers` is the caller's object, not a copy — destructuring
//  never clones. Copy it deliberately if you plan to mutate.

import { test, eq, ok } from '../../_lib/check.js';

export function createRequest({
  url,
  method = 'GET',
  headers = {},
  ...extras
} = {}) {
  return { url, method, headers, extras };
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
