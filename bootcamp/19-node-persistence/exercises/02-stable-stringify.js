// ─────────────────────────────────────────────────────────────────────────
//  02 · stable stringify                                   ★☆☆ warm-up
//  concepts: canonical form · recursion · JSON
//  run: node 02-stable-stringify.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `JSON.stringify` writes keys in insertion order, so two objects with
//  identical content can produce different bytes. That breaks caching,
//  content hashing and "did anything change?" comparisons. A canonical
//  form fixes it: sort object keys at every depth, leave arrays alone.
//
//      stableStringify({ b: 1, a: 2 })          → '{"a":2,"b":1}'
//      stableStringify({ a: [{ z: 1, y: 2 }] }) → '{"a":[{"y":2,"z":1}]}'
//      stableStringify([3, 1, 2])               → '[3,1,2]'   (order kept)
//      sameContent({ a: 1, b: 2 }, { b: 2, a: 1 })  → true
//
//  hint: build a canonical *copy* first, recursively, then hand that to
//  JSON.stringify. Watch out — `typeof null === 'object'`.

import { test, eq, ok } from '../../_lib/check.js';

export function stableStringify(value) {
  throw new Error('TODO');
}

export function sameContent(a, b) {
  throw new Error('TODO');
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
