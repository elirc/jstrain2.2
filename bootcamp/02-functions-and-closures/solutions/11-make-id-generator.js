// ─────────────────────────────────────────────────────────────────────────
//  11 · makeIdGenerator — SOLUTION                         ★☆☆ warm-up
//  run: node 11-make-id-generator.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the closure captures two things — the mutable counter and
//  the (never changing) prefix parameter. Parameters are captured just
//  like local variables, which is what makes factory functions so useful:
//  the configuration is baked in once and the returned function needs no
//  arguments at all.

import { test, eq, ok } from '../../_lib/check.js';

export function makeIdGenerator(prefix = 'id') {
  let n = 0;
  return () => {
    n += 1;
    return `${prefix}-${n}`;
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('numbers ids from one', () => {
  const nextId = makeIdGenerator();
  eq(nextId(), 'id-1');
  eq(nextId(), 'id-2');
  eq(nextId(), 'id-3');
});

test('uses the prefix you pass', () => {
  const nextUser = makeIdGenerator('user');
  eq(nextUser(), 'user-1');
  eq(nextUser(), 'user-2');
});

test('produces strings', () => {
  const nextId = makeIdGenerator();
  ok(typeof nextId() === 'string');
});

test('two generators count independently', () => {
  const a = makeIdGenerator('a');
  const b = makeIdGenerator('b');
  eq(a(), 'a-1');
  eq(b(), 'b-1');
  eq(a(), 'a-2');
  eq(b(), 'b-2');
});

test('keeps counting over many calls', () => {
  const nextId = makeIdGenerator('row');
  const ids = [1, 2, 3, 4, 5].map(() => nextId());
  eq(ids, ['row-1', 'row-2', 'row-3', 'row-4', 'row-5']);
});

test('produces no duplicates', () => {
  const nextId = makeIdGenerator();
  const ids = [1, 2, 3, 4].map(() => nextId());
  eq(new Set(ids).size, 4);
});
