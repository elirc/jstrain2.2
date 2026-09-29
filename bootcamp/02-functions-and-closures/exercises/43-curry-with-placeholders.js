// ─────────────────────────────────────────────────────────────────────────
//  43 · curry with placeholders                            ★★★ stretch
//  concepts: currying · placeholders · variadic arguments
//  run: node 43-curry-with-placeholders.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Ordinary currying can only fill slots from the left, which is useless
//  when the argument you want to lock in sits in the middle. Lodash solves
//  it with a placeholder — a token that says "not this one yet".
//
//      const tag = (level, scope, msg) => `[${level}] ${scope}: ${msg}`;
//      const curried = curry(tag);
//
//      curried('WARN')('db')('slow')      → '[WARN] db: slow'
//      curried('WARN', 'db')('slow')      → '[WARN] db: slow'
//      curried(_, 'db')('WARN', 'slow')   → '[WARN] db: slow'
//      curried(_, _, 'slow')('WARN')('db')→ '[WARN] db: slow'
//
//  Nothing runs until every slot is filled with a real value. Later
//  arguments fill the placeholders left to right, then pile up at the end.
//  `fn.length` gives the arity; a caller may override it for variadic
//  functions with `curry(fn, 2)`.
//
//  hint: keep the collected arguments in an array; on each call, walk it
//  and swap each placeholder for the next incoming argument, then append
//  whatever incoming arguments are left over

import { test, eq, ok, spy } from '../../_lib/check.js';

// ── given: the placeholder token ──
export const _ = Symbol('placeholder');

export function curry(fn, arity = fn.length) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('all the arguments at once behaves like the original', () => {
  const tag = (level, scope, msg) => `[${level}] ${scope}: ${msg}`;
  eq(curry(tag)('WARN', 'db', 'slow'), '[WARN] db: slow');
});

test('one at a time, or in batches', () => {
  const tag = (level, scope, msg) => `[${level}] ${scope}: ${msg}`;
  const curried = curry(tag);
  eq(curried('WARN')('db')('slow'), '[WARN] db: slow');
  eq(curried('WARN', 'db')('slow'), '[WARN] db: slow');
  eq(curried('WARN')('db', 'slow'), '[WARN] db: slow');
});

test('a placeholder holds a slot open for a later argument', () => {
  const tag = (level, scope, msg) => `[${level}] ${scope}: ${msg}`;
  const dbLog = curry(tag)(_, 'db');
  eq(dbLog('WARN', 'slow'), '[WARN] db: slow');
  eq(dbLog('INFO', 'ok'), '[INFO] db: ok');
});

test('placeholders are filled left to right, in call order', () => {
  const tag = (level, scope, msg) => `[${level}] ${scope}: ${msg}`;
  eq(curry(tag)(_, _, 'slow')('WARN')('db'), '[WARN] db: slow');
  eq(curry(tag)(_, 'db', _)('WARN', 'slow'), '[WARN] db: slow');
});

test('nothing runs until every slot holds a real value', () => {
  const fn = spy((a, b, c) => a + b + c);
  const curried = curry(fn, 3); // a spy forwards ...args, so arity 0
  const partial = curried(1)(_, 3);
  eq(fn.callCount, 0);
  eq(partial(2), 6);
  eq(fn.calls, [[1, 2, 3]]);
});

test('a partially applied stage can be reused', () => {
  const add = curry((a, b) => a + b);
  const add10 = add(10);
  eq(add10(1), 11);
  eq(add10(2), 12);
  eq(add10(3), 13);
});

test('arguments past the arity are dropped', () => {
  const fn = spy((a, b, c) => [a, b, c]);
  eq(curry(fn, 3)('a', 'b', 'c', 'd'), ['a', 'b', 'c']);
  eq(fn.calls, [['a', 'b', 'c']]);
});

test('the arity can be given for a variadic function', () => {
  const count = spy((...xs) => xs.length);
  ok(count.length === 0, 'a rest parameter reports arity 0');
  eq(curry(count, 2)('a')('b'), 2);
});
