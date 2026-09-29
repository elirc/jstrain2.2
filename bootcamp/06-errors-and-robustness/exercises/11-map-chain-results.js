// ─────────────────────────────────────────────────────────────────────────
//  11 · map and chain results                               ★★★ stretch
//  concepts: pipelines · short-circuit · flattening
//  run: node 11-map-chain-results.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Results only pay off if you can string them together without an `if`
//  after every step. Two combinators do it:
//
//    succeed(value) → { ok: true, value }
//    fail(error)    → { ok: false, error }   (non-Errors get wrapped)
//
//    mapResult(result, fn)   fn returns a PLAIN value; it gets wrapped
//        mapResult(succeed(' 42 '), (s) => s.trim())  → succeed('42')
//        mapResult(fail(e), (s) => s.trim())          → the same failure
//
//    chainResult(result, fn) fn returns a RESULT; no double wrapping
//        chainResult(succeed('42'), parseToResult) → succeed(42)
//
//  Both skip fn entirely on a failure, and both turn a throw inside fn
//  into a failure rather than letting it escape.
//
//  hint: the only difference between the two is whether you wrap fn's
//  return value or trust it.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function succeed(value) {
  throw new Error('TODO');
}

export function fail(error) {
  throw new Error('TODO');
}

export function mapResult(result, fn) {
  throw new Error('TODO');
}

export function chainResult(result, fn) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('succeed and fail build the two shapes', () => {
  eq(succeed(1), { ok: true, value: 1 });
  const failure = fail('boom');
  eq(failure.ok, false);
  ok(failure.error instanceof Error);
  eq(failure.error.message, 'boom');
});

test('mapResult transforms the value inside a success', () => {
  eq(mapResult(succeed(' 42 '), (s) => s.trim()), { ok: true, value: '42' });
});

test('mapResult hands a failure straight back, untouched', () => {
  const failure = fail(new Error('nope'));
  ok(mapResult(failure, (s) => s.trim()) === failure);
});

test('mapResult does not run fn on a failure', () => {
  const fn = spy((s) => s);
  mapResult(fail(new Error('nope')), fn);
  eq(fn.callCount, 0);
});

test('a throw inside fn becomes a failure, not an escape', () => {
  const result = mapResult(succeed('x'), () => {
    throw new Error('mapper exploded');
  });
  eq(result.ok, false);
  eq(result.error.message, 'mapper exploded');
});

test('chainResult flattens — no result inside a result', () => {
  eq(chainResult(succeed('42'), (s) => succeed(Number(s))), {
    ok: true,
    value: 42,
  });
});

test('chainResult stops at the first failure and keeps its error', () => {
  const second = spy(() => succeed('never'));
  const result = chainResult(
    chainResult(succeed('x'), () => fail(new Error('step one failed'))),
    second
  );
  eq(result.error.message, 'step one failed');
  eq(second.callCount, 0);
});

test('a whole pipeline reads top to bottom', () => {
  const parse = (text) => {
    const n = Number(text);
    return Number.isInteger(n) ? succeed(n) : fail(`${text} is not an int`);
  };
  eq(chainResult(mapResult(succeed('  42 '), (s) => s.trim()), parse), {
    ok: true,
    value: 42,
  });
  eq(
    chainResult(mapResult(succeed('  4x '), (s) => s.trim()), parse).error
      .message,
    '4x is not an int'
  );
});
