// ─────────────────────────────────────────────────────────────────────────
//  25 · the other rail                                      ★★★ stretch
//  concepts: mapError · recovery · fallbacks that can fail
//  run: node 25-map-error-recover.js
// ─────────────────────────────────────────────────────────────────────────
//
//  mapResult and chainResult (exercise 11) work on the success rail and
//  step over failures. Everything a real pipeline does at the END —
//  adding context, falling back to a cache, giving up gracefully —
//  happens on the OTHER rail. Three combinators cover it.
//
//    mapError(result, fn)     fn(error) → a new error (or a string)
//        mapError(fail('ENOENT'), (e) =>
//            new Error('reading config failed', { cause: e }))
//        a success passes through as the very same object; fn is not run
//
//    recover(result, fn)      fn(error) → a plain VALUE
//        recover(fail(e), () => ({ theme: 'light' })) → a success
//
//    recoverWith(result, fn)  fn(error) → another RESULT
//        the fallback is allowed to fail too, and then that failure is
//        the answer
//
//  hint: each one is a single ternary on `result.ok`. The difference
//  between recover and recoverWith is the same as the difference
//  between map and chain: do you wrap fn's return value, or trust it?

import { test, eq, ok, spy } from '../../_lib/check.js';

export function mapError(result, fn) {
  throw new Error('TODO');
}

export function recover(result, fn) {
  throw new Error('TODO');
}

export function recoverWith(result, fn) {
  throw new Error('TODO');
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
