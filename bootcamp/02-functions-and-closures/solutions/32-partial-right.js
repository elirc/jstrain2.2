// ─────────────────────────────────────────────────────────────────────────
//  32 · partialRight — SOLUTION                            ★★☆ core
//  run: node 32-partial-right.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: one line, one spread each side — the caller's arguments
//  first, the preset last. Everything interesting is in the order.
//  The trap is that "the rest" means all of it. `partial` tolerates extra
//  arguments (they pile up at the end, where most functions ignore them);
//  `partialRight` cannot, because anything extra pushes your preset further
//  right, past the parameter it was aimed at. That is exactly what happens
//  with `map`, which calls back with (value, index, array): the preset
//  lands in the fourth slot and the index becomes the divisor. Cap the
//  arity — `map((n) => half(n))` or `map(unary(half))` — whenever a
//  right-partialled function meets a callback API.

import { test, eq, ok, spy } from '../../_lib/check.js';

// ── given: the function to configure ──
const divide = (a, b) => a / b;

export function partialRight(fn, ...preset) {
  return (...args) => fn(...args, ...preset);
}

export function divideBy(divisor) {
  return partialRight(divide, divisor);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('locks in the trailing argument', () => {
  const subtractOne = partialRight((a, b) => a - b, 1);
  eq(subtractOne(10), 9);
});

test('locks in several trailing arguments, in order', () => {
  const log = (level, scope, msg) => `[${level}] ${scope}: ${msg}`;
  const dbSlow = partialRight(log, 'db', 'slow query');
  eq(dbSlow('WARN'), '[WARN] db: slow query');
});

test('the caller arguments go in first, the preset after them', () => {
  const fn = spy((...args) => args);
  partialRight(fn, 'y', 'z')('a', 'b');
  eq(fn.calls, [['a', 'b', 'y', 'z']]);
});

test('with no preset it just forwards everything', () => {
  const fn = spy((a, b) => a + b);
  eq(partialRight(fn)(2, 3), 5);
  eq(fn.calls, [[2, 3]]);
});

test('each configured function keeps its own preset', () => {
  const join = (...parts) => parts.join('-');
  const toCsv = partialRight(join, 'csv');
  const toTsv = partialRight(join, 'tsv');
  eq(toCsv('report'), 'report-csv');
  eq(toTsv('report'), 'report-tsv');
});

test('divideBy is built out of partialRight', () => {
  const half = divideBy(2);
  ok(typeof half === 'function');
  eq(half(10), 5);
  eq(half(7), 3.5);
});

test('careful: map passes three arguments and they all land first', () => {
  const half = divideBy(2);
  eq([10, 20].map((n) => half(n)), [5, 10]);
  eq([10, 20].map(half), [Infinity, 20], 'the index became the divisor');
});
