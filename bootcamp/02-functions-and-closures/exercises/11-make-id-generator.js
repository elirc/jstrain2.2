// ─────────────────────────────────────────────────────────────────────────
//  11 · makeIdGenerator                                    ★☆☆ warm-up
//  concepts: closures · factories · defaults
//  run: node 11-make-id-generator.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A sequence generator: same idea as makeCounter, but the private state
//  is formatted into a string. Handy any time you need unique keys
//  without a database.
//
//      const nextId = makeIdGenerator();
//      nextId()   → 'id-1'      nextId()   → 'id-2'
//
//      const nextUser = makeIdGenerator('user');
//      nextUser() → 'user-1'    nextUser() → 'user-2'
//
//  Numbering always starts at 1 and each generator counts on its own.

import { test, eq, ok } from '../../_lib/check.js';

export function makeIdGenerator(prefix = 'id') {
  throw new Error('TODO');
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
