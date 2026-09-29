// ─────────────────────────────────────────────────────────────────────────
//  27 · safe stringify (circular refs)                     ★★★ stretch
//  concepts: cycles · recursion · JSON.stringify
//  run: node 27-safe-stringify.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `JSON.stringify` throws "Converting circular structure to JSON" the
//  first time it meets a cycle — exactly when you most want to log the
//  object. Replace cycles with '[Circular]' instead. Also take an indent.
//
//      const a = { name: 'a' };  a.self = a;
//      safeStringify(a)    → '{"name":"a","self":"[Circular]"}'
//      const s = { n: 1 };
//      safeStringify({ x: s, y: s })
//                          → '{"x":{"n":1},"y":{"n":1}}'
//
//  Only an ANCESTOR counts as a cycle: a value that appears twice in
//  different branches must still be serialised in full.
//
//  hint: keep a Set of the nodes you are currently inside, and delete
//  each one on the way back out.

import { test, eq, ok } from '../../_lib/check.js';

export function safeStringify(value, indent = 0) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('plain data serialises exactly like JSON.stringify', () => {
  const data = { a: 1, b: ['x', null], c: { d: true } };
  eq(safeStringify(data), JSON.stringify(data));
});

test('a self-reference becomes [Circular]', () => {
  const a = { name: 'a' };
  a.self = a;
  eq(safeStringify(a), '{"name":"a","self":"[Circular]"}');
});

test('a cycle deeper in the tree is caught too', () => {
  const parent = { name: 'p', children: [] };
  parent.children.push({ name: 'c', parent });
  eq(
    safeStringify(parent),
    '{"name":"p","children":[{"name":"c","parent":"[Circular]"}]}'
  );
});

test('an array that contains itself survives', () => {
  const list = [1];
  list.push(list);
  eq(safeStringify(list), '[1,"[Circular]"]');
});

test('a repeated sibling is NOT a cycle', () => {
  const shared = { n: 1 };
  eq(safeStringify({ x: shared, y: shared }), '{"x":{"n":1},"y":{"n":1}}');
});

test('the indent argument pretty-prints', () => {
  eq(safeStringify({ a: 1 }, 2), '{\n  "a": 1\n}');
});

test('Dates still serialise as ISO strings', () => {
  const out = safeStringify({ at: new Date('2020-01-02T03:04:05.000Z') });
  eq(out, '{"at":"2020-01-02T03:04:05.000Z"}');
});

test('the output is always parseable JSON', () => {
  const a = { name: 'a', list: [1, 2] };
  a.self = a;
  const parsed = JSON.parse(safeStringify(a));
  eq(parsed.self, '[Circular]');
  ok(Array.isArray(parsed.list));
});
