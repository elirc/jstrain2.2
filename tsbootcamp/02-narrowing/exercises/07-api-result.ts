// ─────────────────────────────────────────────────────────────────────────
//  07 · ApiResult                                            ★★☆ core
//  concepts: generic discriminated unions · result types
//  run: node ../run.js exercises/07-api-result.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Every network call ends one of two ways. A generic discriminated union
//  models that honestly: on the ok side there is `data`, on the error
//  side there is `error`, and NEITHER side has the other's member. You
//  cannot read `.data` without proving the call succeeded.
//
//      success(7)                       → { status: 'ok', data: 7 }
//      failure('boom')                  → { status: 'error', error: 'boom' }
//      unwrapOr(success(7), 0)          → 7
//      unwrapOr(failure('boom'), 0)     → 0
//      mapResult(success(2), double)    → { status: 'ok', data: 4 }
//      mapResult(failure('boom'), fn)   → unchanged, fn never runs
//
//  hint: `status` is the tag; the payload member differs per variant.

import { test, eq, spy } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

function probe<T>(value: T): T {
  return value;
}

export type ApiResult<T> = TODO;

export function success<T>(data: T): ApiResult<T> {
  throw new Error('TODO');
}

export function failure(message: string): ApiResult<never> {
  throw new Error('TODO');
}

export function unwrapOr<T>(result: ApiResult<T>, fallback: T): T {
  throw new Error('TODO');
}

export function mapResult<T, U>(
  result: ApiResult<T>,
  fn: (value: T) => U
): ApiResult<U> {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('success tags the payload', () => {
  eq(success(7), { status: 'ok', data: 7 });
});

test('failure tags the message', () => {
  eq(failure('boom'), { status: 'error', error: 'boom' });
});

test('unwrapOr returns the data when there is data', () => {
  eq(unwrapOr(success(7), 0), 7);
});

test('unwrapOr returns the fallback on an error', () => {
  const bad: ApiResult<number> = failure('boom');
  eq(unwrapOr(bad, 0), 0);
});

test('mapResult transforms the ok payload', () => {
  eq(mapResult(success(2), (n) => n * 2), { status: 'ok', data: 4 });
});

test('mapResult leaves an error alone and never calls fn', () => {
  const bad: ApiResult<number> = failure('boom');
  const double = spy((n: number) => n * 2);
  eq(mapResult(bad, double), { status: 'error', error: 'boom' });
  eq(double.callCount, 0);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<Equal<ApiResult<number>['status'], 'ok' | 'error'>>;

function _typeTests() {
  const result = success(42);
  type _shape = Expect<Equal<typeof result, ApiResult<number>>>;

  if (result.status === 'ok') {
    const p = probe(result.data);
    type _data = Expect<Equal<typeof p, number>>;
    use(p);

    // @ts-expect-error — the ok variant carries no .error
    result.error;
  } else {
    const p = probe(result.error);
    type _error = Expect<Equal<typeof p, string>>;
    use(p);
  }

  const mapped = mapResult(success(1), (n) => String(n));
  type _mapped = Expect<Equal<typeof mapped, ApiResult<string>>>;
  use(mapped);

  // @ts-expect-error — the fallback must match the payload type
  unwrapOr(success(1), 'zero');
}
use(_typeTests);
