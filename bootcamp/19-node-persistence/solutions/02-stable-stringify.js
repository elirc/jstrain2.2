// ─────────────────────────────────────────────────────────────────────────
//  02 · stable stringify — SOLUTION                         ★☆☆ warm-up
//  run: node 02-stable-stringify.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: do not try to sort the *text*. Build a canonical value
//  first and let JSON.stringify do the escaping. `canonical` recurses:
//  arrays map over their items (order is meaning, never sort them),
//  objects are rebuilt with `Object.keys(...).sort()`, everything else is
//  returned as is. The classic wrong turn is `typeof x === 'object'` with
//  no null guard — `typeof null` is `'object'`, so null falls into the
//  object branch and you get `{}` instead of `null`.
//  This is the function that makes content hashing possible: same content
//  in, same bytes out, so the same sha256 out (exercise 12).

import { test, eq, ok } from '../../_lib/check.js';

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value === null || typeof value !== 'object') return value;
  const out = {};
  for (const key of Object.keys(value).sort()) out[key] = canonical(value[key]);
  return out;
}

export function stableStringify(value) {
  return JSON.stringify(canonical(value));
}

export function sameContent(a, b) {
  return stableStringify(a) === stableStringify(b);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('sorts keys at the top level', () => {
  eq(stableStringify({ b: 1, a: 2, c: 3 }), '{"a":2,"b":1,"c":3}');
});

test('sorts keys at every depth', () => {
  eq(
    stableStringify({ outer: { z: 1, a: { y: 2, b: 3 } } }),
    '{"outer":{"a":{"b":3,"y":2},"z":1}}'
  );
});

test('array order is data — it is never sorted', () => {
  eq(stableStringify([3, 1, 2]), '[3,1,2]');
  eq(stableStringify({ ids: ['c', 'a', 'b'] }), '{"ids":["c","a","b"]}');
});

test('sorts objects nested inside arrays', () => {
  eq(stableStringify({ a: [{ z: 1, y: 2 }] }), '{"a":[{"y":2,"z":1}]}');
});

test('primitives and null pass straight through', () => {
  eq(stableStringify(42), '42');
  eq(stableStringify('hi'), '"hi"');
  eq(stableStringify(null), 'null');
  eq(stableStringify({ x: null }), '{"x":null}');
});

test('two independently built objects produce identical bytes', () => {
  const built = {};
  built.zone = 'eu';
  built.id = 3;
  eq(stableStringify(built), stableStringify({ id: 3, zone: 'eu' }));
  ok(stableStringify(built) === '{"id":3,"zone":"eu"}');
});

test('sameContent ignores key order but not values', () => {
  ok(sameContent({ a: 1, b: 2 }, { b: 2, a: 1 }));
  ok(!sameContent({ a: 1, b: 2 }, { a: 1, b: 3 }));
  ok(sameContent({ a: 1 }, { a: 1, b: undefined }));
});
