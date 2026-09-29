// ─────────────────────────────────────────────────────────────────────────
//  32 · partialRight                                       ★★☆ core
//  concepts: closures · argument order · rest and spread
//  run: node 32-partial-right.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `partial` locks in the LEADING arguments. Plenty of APIs put the
//  configuration last instead — `divide(value, by)`, `round(value, digits)`
//  — so you need the mirror image: fix the tail, take the head later.
//
//      const subtractFrom = partialRight((a, b) => a - b, 1);
//      subtractFrom(10)                → 9        // 10 - 1
//
//      const shout = partialRight(log, 'db', 'slow query');
//      shout('WARN')                   → log('WARN', 'db', 'slow query')
//
//  Then use it: `divideBy(2)` must return a one-argument function built
//  with `partialRight` over the given `divide`.
//
//      divideBy(2)(10)                 → 5
//
//  hint: `(...args) => fn(...args, ...preset)` — and note that *every*
//  argument the caller passes lands before the preset, which is why
//  `[10, 20].map(divideBy(2))` does not do what you would hope

import { test, eq, ok, spy } from '../../_lib/check.js';

// ── given: the function to configure ──
const divide = (a, b) => a / b;

export function partialRight(fn, ...preset) {
  throw new Error('TODO');
}

export function divideBy(divisor) {
  throw new Error('TODO');
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
