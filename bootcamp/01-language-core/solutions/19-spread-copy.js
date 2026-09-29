// ─────────────────────────────────────────────────────────────────────────
//  19 · spread copies — SOLUTION                            ★☆☆ warm-up
//  run: node 19-spread-copy.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: spread builds a NEW container and copies the top-level
//  slots into it. That is enough to make the original safe from
//  push/assignment — which is why these three one-liners replace every
//  `push`, `Object.assign(target, ...)` and `slice()` in modern code.
//
//  What it does not do is go deeper: `copyList([inner])[0]` is the same
//  object as `inner`. Mutating it is visible through both arrays. That
//  is the single most common "why did my state change?" bug — exercise
//  23 has the deep answer.
//
//  Key order in an object spread is source order, and a later key always
//  wins — even when its value is undefined, because the key was present.

import { test, eq, ok } from '../../_lib/check.js';

export function copyList(list) {
  return [...list];
}

export function withItem(list, item) {
  return [...list, item];
}

export function merge(base, patch) {
  return { ...base, ...patch };
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
