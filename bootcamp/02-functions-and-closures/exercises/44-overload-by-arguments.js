// ─────────────────────────────────────────────────────────────────────────
//  44 · overloading by arguments                              ★★☆ core
//  concepts: arguments · polymorphic APIs · dispatch
//  run: node 44-overload-by-arguments.js
// ─────────────────────────────────────────────────────────────────────────
//
//  JavaScript has no overloads, so the friendly libraries fake them: one
//  entry point that inspects what it was handed and dispatches. Build both
//  flavours of the trick.
//
//  `overload(byCount)` dispatches on HOW MANY arguments arrived:
//
//      const at = overload({
//        1: (i) => `row ${i}`,
//        2: (i, j) => `cell ${i},${j}`,
//      });
//      at(3)       → 'row 3'
//      at(1, 2)    → 'cell 1,2'
//      at()        → TypeError: no overload for 0 arguments
//
//  `list(items, arg)` dispatches on the TYPE of its second argument:
//
//      list(items)                    → a copy of everything
//      list(items, 2)                 → the first 2
//      list(items, (n) => n > 2)      → the ones that pass
//      list(items, { where, limit })  → filtered, then capped
//
//  In the options object `where` and `limit` are each optional.
//
//  hint: dispatch on `typeof`, never on truthiness — `list(items, 0)` must
//  mean "none", and an explicitly passed `undefined` still counts as an
//  argument

import { test, eq, ok, throws, spy } from '../../_lib/check.js';

export function overload(byCount) {
  throw new Error('TODO');
}

export function list(items, arg) {
  throw new Error('TODO');
}

// ── given: the fixture the tests slice up ──
const nums = [1, 2, 3, 4];

// ──────────────────────────── tests ──────────────────────────────────────

test('overload picks the handler for the number of arguments', () => {
  const at = overload({
    1: (i) => `row ${i}`,
    2: (i, j) => `cell ${i},${j}`,
  });
  eq(at(3), 'row 3');
  eq(at(1, 2), 'cell 1,2');
});

test('the handler receives the arguments as they were passed', () => {
  const one = spy(() => 'one');
  const two = spy(() => 'two');
  const at = overload({ 1: one, 2: two });
  at('a');
  at('a', 'b');
  eq(one.calls, [['a']]);
  eq(two.calls, [['a', 'b']]);
});

test('an explicitly passed undefined still counts as an argument', () => {
  const at = overload({
    0: () => 'nothing',
    1: (x) => `got ${x}`,
  });
  eq(at(), 'nothing');
  eq(at(undefined), 'got undefined');
});

test('an unsupported count throws a TypeError that says so', () => {
  const at = overload({ 1: (x) => x });
  throws(() => at(1, 2, 3), 'no overload for 3 arguments');
  let caught;
  try { at(1, 2, 3); } catch (e) { caught = e; }
  ok(caught instanceof TypeError, 'specifically a TypeError');
});

test('list with no second argument copies everything', () => {
  const all = list(nums);
  eq(all, [1, 2, 3, 4]);
  ok(all !== nums, 'a copy, so the caller cannot mutate the source');
});

test('a number means "the first n"', () => {
  eq(list(nums, 2), [1, 2]);
  eq(list(nums, 0), [], 'zero means none, not everything');
});

test('a function means "the ones that pass"', () => {
  eq(list(nums, (n) => n > 2), [3, 4]);
  eq(list(nums, (n) => n > 99), []);
});

test('an object means options: filter first, then cap', () => {
  eq(list(nums, { where: (n) => n % 2 === 0 }), [2, 4]);
  eq(list(nums, { where: (n) => n > 1, limit: 2 }), [2, 3]);
  eq(list(nums, { limit: 1 }), [1]);
});
