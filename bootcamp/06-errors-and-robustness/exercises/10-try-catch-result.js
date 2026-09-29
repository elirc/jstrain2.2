// ─────────────────────────────────────────────────────────────────────────
//  10 · results instead of throws                             ★★☆ core
//  concepts: Result values · normalizing errors
//  run: node 10-try-catch-result.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A thrown error is invisible in a function's signature — nothing warns
//  the caller it exists. A Result makes failure a value you have to look
//  at: { ok: true, value } or { ok: false, error }.
//
//    tryCatch(fn) — run fn, hand back a Result
//        tryCatch(() => 2 + 2)              → { ok: true, value: 4 }
//        tryCatch(() => { throw e; })       → { ok: false, error: e }
//        tryCatch(() => { throw 'boom'; })  → { ok: false, error:
//                                              Error('boom') }
//
//    unwrapOr(result, fallback) — the value, or the fallback
//        unwrapOr({ ok: true, value: 7 }, 0)      → 7
//        unwrapOr({ ok: false, error: e }, 0)     → 0
//
//  Failures always come back as real Errors, even if something threw a
//  string.
//
//  hint: `result.ok ? ... : ...` — decide on the flag, never on
//  truthiness of the value.

import { test, eq, ok } from '../../_lib/check.js';

export function tryCatch(fn) {
  throw new Error('TODO');
}

export function unwrapOr(result, fallback) {
  throw new Error('TODO');
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
