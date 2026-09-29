// ─────────────────────────────────────────────────────────────────────────
//  29 · logical assignment                                  ★☆☆ warm-up
//  concepts: ??= · ||= · &&= · assignment that may not happen
//  run: node 29-logical-assignment.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `a ??= b` is `a ?? (a = b)`: it assigns only when `a` is null or
//  undefined. `||=` assigns when `a` is falsy. `&&=` assigns only when `a`
//  is already truthy. All three skip the right-hand side entirely when
//  they do not need it — no wasted work, no surprise property creation.
//
//  normalizeConfig(config) fills a config in place and returns it:
//
//      host      ??= 'localhost'     (an explicit '' stays '')
//      port      ??= 8080            (an explicit 0 stays 0)
//      name      ||= 'unnamed'       (an empty name IS replaced)
//      tags      ??= []
//      logLevel  &&= lowercased      (missing stays missing — no key added)
//
//      normalizeConfig({ port: 0, name: '' })
//      → { port: 0, name: 'unnamed', host: 'localhost', tags: [] }
//
//  memoize(cache, key, compute) returns cache[key], computing it with
//  compute(key) only the first time — including when the answer is 0.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function normalizeConfig(config) {
  throw new Error('TODO');
}

export function memoize(cache, key, compute) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('fills in every missing field', () => {
  eq(normalizeConfig({}), {
    host: 'localhost',
    port: 8080,
    name: 'unnamed',
    tags: [],
  });
});

test('??= keeps 0 and "" — they are real choices', () => {
  const config = normalizeConfig({ port: 0, host: '' });
  eq(config.port, 0);
  eq(config.host, '');
});

test('||= replaces an empty name, which is the point of using it', () => {
  eq(normalizeConfig({ name: '' }).name, 'unnamed');
  eq(normalizeConfig({ name: 'api' }).name, 'api');
});

test('&&= transforms a level that is there', () => {
  eq(normalizeConfig({ logLevel: 'DEBUG' }).logLevel, 'debug');
  eq(normalizeConfig({ logLevel: 'Warn' }).logLevel, 'warn');
});

test('&&= on a missing field does not even create the key', () => {
  const config = normalizeConfig({});
  eq(config.logLevel, undefined);
  ok(!Object.hasOwn(config, 'logLevel'), 'no logLevel key was added');
});

test('normalizeConfig edits in place and hands the same object back', () => {
  const config = { port: 3000 };
  ok(normalizeConfig(config) === config);
  eq(config.host, 'localhost');
});

test('memoize computes once per key and remembers the answer', () => {
  const compute = spy((key) => `value:${key}`);
  const cache = {};
  eq(memoize(cache, 'a', compute), 'value:a');
  eq(memoize(cache, 'a', compute), 'value:a');
  eq(memoize(cache, 'b', compute), 'value:b');
  eq(compute.callCount, 2);
  eq(cache, { a: 'value:a', b: 'value:b' });
});

test('memoize caches a falsy answer too, unlike ||=', () => {
  const compute = spy(() => 0);
  const cache = {};
  eq(memoize(cache, 'hits', compute), 0);
  eq(memoize(cache, 'hits', compute), 0);
  eq(compute.callCount, 1);
});
