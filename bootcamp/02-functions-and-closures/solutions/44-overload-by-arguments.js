// ─────────────────────────────────────────────────────────────────────────
//  44 · overloading by arguments — SOLUTION                   ★★☆ core
//  run: node 44-overload-by-arguments.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: two dispatch strategies, two different questions. Counting
//  arguments is what `arguments.length` (or a rest parameter) is for, and
//  it is honest: it reports what the CALLER passed, so `at(undefined)` is
//  one argument, not zero. Defaults never change that number.
//  Type dispatch is the other half, and the trap is truthiness. `if (arg)`
//  sends `0` down the "no argument" path and silently returns everything —
//  the sort of bug that only shows up on the day someone asks for a limit
//  of zero. `arg === undefined` for absence and `typeof` for the rest keeps
//  each shape distinct.
//  The engineering advice underneath: an overloaded entry point is a
//  kindness at the API boundary and a menace deeper in. Dispatch once, at
//  the edge, then call small single-purpose functions — otherwise every
//  caller has to read the dispatch table to know what their argument means.

import { test, eq, ok, throws, spy } from '../../_lib/check.js';

export function overload(byCount) {
  return (...args) => {
    const handler = byCount[args.length];
    if (!handler) {
      throw new TypeError(`no overload for ${args.length} arguments`);
    }
    return handler(...args);
  };
}

export function list(items, arg) {
  if (arg === undefined) return [...items];
  if (typeof arg === 'number') return items.slice(0, arg);
  if (typeof arg === 'function') return items.filter(arg);
  const { where, limit } = arg;
  const filtered = where ? items.filter(where) : [...items];
  return limit === undefined ? filtered : filtered.slice(0, limit);
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
