// ─────────────────────────────────────────────────────────────────────────
//  10 · results instead of throws — SOLUTION                  ★★☆ core
//  run: node 10-try-catch-result.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: tryCatch is the adapter between the two worlds — throwing
//  code goes in, a plain value comes out. Normalizing the error on the
//  way out means every consumer can rely on `.message` existing.
//
//  When each one fits:
//    throw    for the unexpected — a bug, a broken invariant, an outage.
//             It should travel up to whoever can log it or turn it into
//             a 500. Most of your code should not catch it at all.
//    Result   for the expected — a form field the user typed wrong, a
//             cache miss, "no such record". These are ordinary outcomes,
//             and making the caller destructure `.ok` is a feature.
//  Rule of thumb: if the caller has a sensible next move, return it as a
//  value; if the only honest response is "give up and tell someone",
//  throw. Do not mix both in one function's contract.
//  Note `result.ok ? ... : ...` rather than `result.value || fallback` —
//  a valid value of 0, '' or null is not a failure.

import { test, eq, ok } from '../../_lib/check.js';

export function tryCatch(fn) {
  try {
    return { ok: true, value: fn() };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

export function unwrapOr(result, fallback) {
  return result.ok ? result.value : fallback;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a successful call becomes an ok result', () => {
  eq(tryCatch(() => 2 + 2), { ok: true, value: 4 });
});

test('a thrown Error becomes a failed result', () => {
  const result = tryCatch(() => {
    throw new Error('nope');
  });
  eq(result.ok, false);
  eq(result.error.message, 'nope');
});

test('the original error object survives the trip', () => {
  const boom = new RangeError('out of range');
  ok(
    tryCatch(() => {
      throw boom;
    }).error === boom
  );
});

test('a thrown non-Error is normalized into an Error', () => {
  const result = tryCatch(() => {
    throw 'boom';
  });
  ok(result.error instanceof Error);
  eq(result.error.message, 'boom');
});

test('returning undefined is still a success', () => {
  eq(tryCatch(() => {}), { ok: true, value: undefined });
});

test('unwrapOr hands back the value on success', () => {
  eq(unwrapOr(tryCatch(() => 7), 0), 7);
});

test('unwrapOr hands back the fallback on failure', () => {
  eq(
    unwrapOr(
      tryCatch(() => {
        throw new Error('nope');
      }),
      0
    ),
    0
  );
});

test('unwrapOr keeps a falsy success instead of the fallback', () => {
  eq(unwrapOr(tryCatch(() => null), 'fallback'), null);
  eq(unwrapOr(tryCatch(() => 0), 99), 0);
});
