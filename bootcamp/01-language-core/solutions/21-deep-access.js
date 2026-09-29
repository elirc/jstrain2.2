// ─────────────────────────────────────────────────────────────────────────
//  21 · getIn — SOLUTION                                     ★★★ stretch
//  run: node 21-deep-access.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: normalise the path, then walk it one step at a time with
//  `current?.[key]`. The `?.` means a null or undefined `current` yields
//  undefined instead of throwing "cannot read properties of null", so a
//  null halfway down the path simply propagates.
//
//  The subtle line is `if (current === undefined) return fallback` —
//  strict, and only against undefined. Using `!current` or `current ==
//  null` there would turn a real 0, '' or null into the fallback, which
//  is the bug this function exists to prevent. Returning early also
//  avoids indexing into the next key.
//
//  readPort is the same idea as an expression: `?.` guards the walk, `??`
//  guards the result. `||` would send port 0 to 8080.

import { test, eq } from '../../_lib/check.js';

export function getIn(source, path, fallback) {
  const keys = Array.isArray(path) ? path : String(path).split('.');
  let current = source;
  for (const key of keys) {
    current = current?.[key];
    if (current === undefined) return fallback;
  }
  return current;
}

export function readPort(config) {
  return config?.server?.port ?? 8080;
}

// ──────────────────────────── tests ──────────────────────────────────────

const CONFIG = {
  server: { host: 'localhost', port: 0 },
  flags: { beta: false, name: '' },
  owner: null,
  hooks: [{ id: 5, run: () => 'ran' }],
};

test('reads a value several levels down', () => {
  eq(getIn(CONFIG, 'server.host'), 'localhost');
  eq(getIn({ a: { b: { c: 1 } } }, 'a.b.c'), 1);
});

test('a missing branch yields the fallback', () => {
  eq(getIn(CONFIG, 'server.tls.cert', 'none'), 'none');
  eq(getIn(CONFIG, 'nope.nope', 'none'), 'none');
});

test('the fallback defaults to undefined', () => {
  eq(getIn(CONFIG, 'nope.nope'), undefined);
});

test('falsy values that exist are returned, not replaced', () => {
  eq(getIn(CONFIG, 'server.port', 8080), 0);
  eq(getIn(CONFIG, 'flags.beta', true), false);
  eq(getIn(CONFIG, 'flags.name', 'anon'), '');
});

test('an explicit null is a value; only undefined is missing', () => {
  eq(getIn(CONFIG, 'owner', 'none'), null);
  eq(getIn(CONFIG, 'owner.name', 'none'), 'none');
});

test('accepts an array path and numeric indexes', () => {
  eq(getIn(CONFIG, ['server', 'host']), 'localhost');
  eq(getIn(CONFIG, 'hooks.0.id'), 5);
  eq(getIn(CONFIG, ['hooks', 1, 'id'], 'none'), 'none');
});

test('a nullish source returns the fallback instead of throwing', () => {
  eq(getIn(null, 'a.b', 'none'), 'none');
  eq(getIn(undefined, 'a', 'none'), 'none');
});

test('readPort keeps port 0 but defaults a missing one', () => {
  eq(readPort({ server: { port: 0 } }), 0);
  eq(readPort({ server: { port: 3000 } }), 3000);
  eq(readPort({ server: {} }), 8080);
  eq(readPort({}), 8080);
  eq(readPort(undefined), 8080);
});
