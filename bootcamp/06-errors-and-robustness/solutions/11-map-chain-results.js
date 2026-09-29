// ─────────────────────────────────────────────────────────────────────────
//  11 · map and chain results — SOLUTION                    ★★★ stretch
//  run: node 11-map-chain-results.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: both combinators start with the same guard — if the
//  result is already a failure, return it unchanged and never call fn.
//  That single line is what a Result pipeline buys you: the "skip the
//  rest on error" behaviour of try/catch, expressed as data.
//  The only difference is the last step. `map` takes a function that
//  knows nothing about Results and wraps whatever it returns; `chain`
//  takes a function that already returns one and passes it through. Wrap
//  a chain function with map and you get succeed(succeed(x)) — the
//  classic bug, and the reason the two have different names.
//  Wrapping fn in try/catch keeps the promise honest: nothing in a
//  pipeline throws, so a caller never needs both `.ok` and a try block.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function succeed(value) {
  return { ok: true, value };
}

export function fail(error) {
  return {
    ok: false,
    error: error instanceof Error ? error : new Error(String(error)),
  };
}

export function mapResult(result, fn) {
  if (!result.ok) return result;
  try {
    return succeed(fn(result.value));
  } catch (err) {
    return fail(err);
  }
}

export function chainResult(result, fn) {
  if (!result.ok) return result;
  try {
    return fn(result.value);
  } catch (err) {
    return fail(err);
  }
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
