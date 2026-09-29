// ─────────────────────────────────────────────────────────────────────────
//  21 · getIn                                                ★★★ stretch
//  concepts: optional chaining · ?? · dynamic property access
//  run: node 21-deep-access.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Config objects are half-filled and deeply nested. Write the lookup
//  that never throws and never lies about falsy values.
//
//  getIn(source, path, fallback) — path is 'a.b.c' or ['a', 'b', 'c'].
//  Walk it; if any step is missing, return `fallback` (undefined when
//  not supplied). A value that IS there is returned as-is, even 0, ''
//  or null. Only `undefined` means "missing".
//
//      getIn({ a: { b: { c: 1 } } }, 'a.b.c')       → 1
//      getIn({ a: {} }, 'a.b.c', 'none')            → 'none'
//      getIn({ a: { b: 0 } }, 'a.b', 'none')        → 0
//      getIn({ a: { b: null } }, 'a.b', 'none')     → null
//      getIn(null, 'a.b', 'none')                   → 'none'
//      getIn({ list: [{ id: 5 }] }, 'list.0.id')    → 5
//
//  readPort(config) → config.server.port when it exists, else 8080.
//
//      readPort({ server: { port: 0 } })  → 0
//      readPort({})                       → 8080
//
//  hint: `current?.[key]` short-circuits the whole chain to undefined the
//  moment `current` is null or undefined — and it works with computed
//  keys, which plain `?.name` does not.

import { test, eq } from '../../_lib/check.js';

export function getIn(source, path, fallback) {
  throw new Error('TODO');
}

export function readPort(config) {
  throw new Error('TODO');
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
