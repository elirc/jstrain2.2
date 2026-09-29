// ─────────────────────────────────────────────────────────────────────────
//  29 · logical assignment — SOLUTION                       ★☆☆ warm-up
//  run: node 29-logical-assignment.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: each operator picks itself by which values count as
//  "missing". Ports and hosts have legitimate falsy values (0, ''), so
//  they take `??=`. A blank display name is not a choice anyone made, so
//  it takes `||=`. `&&=` is the "only if it is already there" operator:
//  `config.logLevel &&= config.logLevel.toLowerCase()` cannot throw on a
//  missing level AND — because the assignment is skipped entirely — it
//  never adds a `logLevel: undefined` key that later `in` checks would
//  see. That is the detail `config.logLevel = config.logLevel?.toLower...`
//  gets wrong.
//
//  memoize is the canonical `??=` idiom. Written with `||=` it would
//  recompute forever whenever the cached answer happened to be 0, '' or
//  false — the same bug as `value || fallback`, just better hidden.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function normalizeConfig(config) {
  config.host ??= 'localhost';
  config.port ??= 8080;
  config.name ||= 'unnamed';
  config.tags ??= [];
  config.logLevel &&= config.logLevel.toLowerCase();
  return config;
}

export function memoize(cache, key, compute) {
  cache[key] ??= compute(key);
  return cache[key];
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
