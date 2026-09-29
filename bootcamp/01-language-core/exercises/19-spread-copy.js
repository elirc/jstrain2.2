// ─────────────────────────────────────────────────────────────────────────
//  19 · spread copies                                       ★☆☆ warm-up
//  concepts: spread · shallow copies · merging
//  run: node 19-spread-copy.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `...` unpacks an array or object into a new one. The copy is SHALLOW:
//  one level of new container, the same nested references inside.
//
//      copyList([1, 2])            → [1, 2]   (a different array)
//      withItem([1, 2], 3)         → [1, 2, 3]  (input untouched)
//      merge({ a: 1, b: 2 }, { b: 3 })  → { a: 1, b: 3 }
//
//  Later keys win — including a key whose value is undefined.
//
//      merge({ a: 1 }, { a: undefined })  → { a: undefined }

import { test, eq, ok } from '../../_lib/check.js';

export function copyList(list) {
  throw new Error('TODO');
}

export function withItem(list, item) {
  throw new Error('TODO');
}

export function merge(base, patch) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('copyList returns an equal but different array', () => {
  const original = [1, 2, 3];
  const copy = copyList(original);
  eq(copy, [1, 2, 3]);
  ok(copy !== original, 'must be a new array');
});

test('the copy is shallow — nested objects are still shared', () => {
  const inner = { n: 1 };
  const copy = copyList([inner]);
  ok(copy[0] === inner, 'spread copies references, not the objects');
});

test('withItem appends without touching the input', () => {
  const original = Object.freeze([1, 2]);
  eq(withItem(original, 3), [1, 2, 3]);
  eq(original, [1, 2]);
});

test('merge lets the patch win', () => {
  eq(merge({ a: 1, b: 2 }, { b: 3 }), { a: 1, b: 3 });
  eq(merge({}, { a: 1 }), { a: 1 });
  eq(merge({ a: 1 }, {}), { a: 1 });
});

test('a patch key set to undefined still overwrites', () => {
  eq(merge({ a: 1 }, { a: undefined }), { a: undefined });
});

test('merge mutates neither input', () => {
  const base = Object.freeze({ a: 1 });
  const patch = Object.freeze({ b: 2 });
  const result = merge(base, patch);
  eq(result, { a: 1, b: 2 });
  eq(base, { a: 1 });
  ok(result !== base && result !== patch, 'must be a new object');
});
