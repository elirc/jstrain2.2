// ─────────────────────────────────────────────────────────────────────────
//  25 · the other rail — SOLUTION                           ★★★ stretch
//  run: node 25-map-error-recover.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three one-liners, and the whole lesson is in which rail
//  each one touches. mapError only ever runs on a failure, so a success
//  is returned as the identical object — no copying, nothing to get
//  subtly wrong. recover crosses from the failure rail to the success
//  rail by wrapping fn's return value; recoverWith trusts fn to return
//  a Result, which is what lets a fallback fail in its own right.
//  Reusing `fail()` inside mapError is what normalizes a returned
//  string into an Error, so callers keep the guarantee that
//  `result.error` is always a real Error with a stack.
//  mapError is the Result-shaped version of `throw new Error(msg,
//  { cause: err })` — the whole point of the last test is that adding
//  context and falling back are two different moves, and doing them in
//  that order means the fallback still knows what it is covering for.
//  Classic wrong turn: recovering first and logging later. Once you
//  have crossed to the success rail the reason is gone; if the caller
//  needs to know it degraded, put it in the value (`stale: true`) or
//  collect reasons as you go — that is exercise 30.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function mapError(result, fn) {
  return result.ok ? result : fail(fn(result.error));
}

export function recover(result, fn) {
  return result.ok ? result : succeed(fn(result.error));
}

export function recoverWith(result, fn) {
  return result.ok ? result : fn(result.error);
}

// ── given: the two Result constructors from exercise 11 ──────────────────

export function succeed(value) {
  return { ok: true, value };
}

export function fail(error) {
  return {
    ok: false,
    error: error instanceof Error ? error : new Error(String(error)),
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('mapError replaces the error and stays a failure', () => {
  const result = mapError(fail('ENOENT'), () => new Error('config missing'));
  eq(result.ok, false);
  eq(result.error.message, 'config missing');
});

test('mapError leaves a success alone and never calls fn', () => {
  const success = succeed(42);
  const fn = spy();
  ok(mapError(success, fn) === success);
  eq(fn.callCount, 0);
});

test('mapError normalizes a string into a real Error', () => {
  const result = mapError(fail('ENOENT'), (err) => `config: ${err.message}`);
  ok(result.error instanceof Error);
  eq(result.error.message, 'config: ENOENT');
});

test('mapError is where context goes — the original rides along', () => {
  const original = new Error('ENOENT');
  const result = mapError(
    fail(original),
    (err) => new Error('reading config failed', { cause: err })
  );
  eq(result.error.message, 'reading config failed');
  ok(result.error.cause === original);
});

test('recover turns a failure into a success', () => {
  eq(recover(fail('cache is cold'), () => ({ theme: 'light' })), {
    ok: true,
    value: { theme: 'light' },
  });
});

test('recover hands the error to fn, and skips a success', () => {
  const fn = spy(() => 'default');
  eq(recover(fail('boom'), fn).value, 'default');
  eq(fn.calls[0][0].message, 'boom');
  const success = succeed(1);
  ok(recover(success, fn) === success);
  eq(fn.callCount, 1);
});

test('recoverWith lets the fallback fail too', () => {
  const result = recoverWith(fail('primary is down'), () =>
    fail('the cache is empty as well')
  );
  eq(result.ok, false);
  eq(result.error.message, 'the cache is empty as well');
});

test('a whole railway reads top to bottom', () => {
  const fromDb = (id) =>
    id === 7 ? succeed({ id: 7 }) : fail(`no user ${id}`);
  const fromCache = (id) =>
    id === 9 ? succeed({ id: 9, stale: true }) : fail('cache miss');

  const readUser = (id) =>
    recoverWith(
      mapError(fromDb(id), (err) =>
        new Error('db read failed', { cause: err })
      ),
      () => fromCache(id)
    );

  eq(readUser(7), { ok: true, value: { id: 7 } });
  eq(readUser(9).value, { id: 9, stale: true });
  eq(readUser(1).error.message, 'cache miss');
});
