// ─────────────────────────────────────────────────────────────────────────
//  43 · curry with placeholders — SOLUTION                 ★★★ stretch
//  run: node 43-curry-with-placeholders.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the state is one array of "slots so far", and each call
//  does two things to it — fill the holes, then append the rest. Written
//  as `received.map(...)` followed by `.concat(incoming)`, where the map
//  callback shifts off the incoming arguments as it fills holes: by the
//  time `concat` runs, `incoming` holds only the leftovers.
//  The readiness test is the subtle part. `merged.length >= arity` is not
//  enough, because a placeholder still sitting in the first `arity` slots
//  means an unfilled hole — check for the token as well. Note also that
//  each stage builds a NEW array rather than mutating `received`, which is
//  what lets a partially applied function be reused: `const warn =
//  curried('WARN')` must survive being called ten times with different
//  scopes.
//  A Symbol makes the placeholder impossible to collide with — a string
//  `'_'` or a magic number could be a legitimate argument, a unique Symbol
//  never is.

import { test, eq, ok, spy } from '../../_lib/check.js';

// ── given: the placeholder token ──
export const _ = Symbol('placeholder');

export function curry(fn, arity = fn.length) {
  const step = (received) => (...incoming) => {
    const merged = received
      .map((slot) =>
        slot === _ && incoming.length ? incoming.shift() : slot
      )
      .concat(incoming);
    const filled = merged.slice(0, arity);
    const ready = filled.length === arity && !filled.includes(_);
    return ready ? fn(...filled) : step(merged);
  };
  return step([]);
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
