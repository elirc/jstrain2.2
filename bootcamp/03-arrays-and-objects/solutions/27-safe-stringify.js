// ─────────────────────────────────────────────────────────────────────────
//  27 · safe stringify (circular refs) — SOLUTION          ★★★ stretch
//  run: node 27-safe-stringify.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the difference between "seen anywhere" and "currently
//  inside" is the whole exercise. A `Set` that you only ever add to marks
//  repeated siblings as circular — a bug you will find in a lot of
//  copy-pasted `safeStringify` snippets. Adding before you recurse and
//  deleting after turns that set into the path from the root to the
//  current node, which is the real definition of a cycle. The Date branch
//  matters for the same reason as in the deep clone: `Object.entries` on a
//  Date is empty, so rebuilding it by hand would produce `{}` instead of
//  letting `JSON.stringify` call its `toJSON`.

import { test, eq, ok } from '../../_lib/check.js';

export function safeStringify(value, indent = 0) {
  const ancestors = new Set();

  const clean = (node) => {
    if (node === null || typeof node !== 'object') return node;
    if (node instanceof Date) return node;
    if (ancestors.has(node)) return '[Circular]';
    ancestors.add(node);
    const out = Array.isArray(node)
      ? node.map(clean)
      : Object.fromEntries(
          Object.entries(node).map(([key, inner]) => [key, clean(inner)])
        );
    ancestors.delete(node);
    return out;
  };

  return JSON.stringify(clean(value), null, indent);
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
