// ─────────────────────────────────────────────────────────────────────────
//  07 · ApiResult — SOLUTION                                 ★★☆ core
//  run: node ../run.js solutions/07-api-result.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the type parameter rides along inside one variant only —
//  `{ status: 'ok'; data: T }` — so narrowing on `status` also resolves
//  where `T` lives. Inside the ok branch `result.data` is `T`; inside the
//  error branch it does not exist at all.
//
//  `failure` returns `ApiResult<never>` so it fits ANY expected payload
//  type: `never` is assignable to everything, so an error result can flow
//  into a slot expecting `ApiResult<number>` without a cast.
//
//  In `mapResult`'s error branch you can `return result` directly — the
//  compiler has narrowed it to `{ status: 'error'; error: string }`,
//  which is a member of `ApiResult<U>` for every U. Rebuilding the object
//  by hand would work too, and would be one more place to typo the tag.
//
//  This is why Result types beat throwing for expected failures: the
//  caller cannot reach the data without handling the other case.

import { test, eq, spy } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

function probe<T>(value: T): T {
  return value;
}

export type ApiResult<T> =
  | { status: 'ok'; data: T }
  | { status: 'error'; error: string };

export function success<T>(data: T): ApiResult<T> {
  return { status: 'ok', data };
}

export function failure(message: string): ApiResult<never> {
  return { status: 'error', error: message };
}

export function unwrapOr<T>(result: ApiResult<T>, fallback: T): T {
  return result.status === 'ok' ? result.data : fallback;
}

export function mapResult<T, U>(
  result: ApiResult<T>,
  fn: (value: T) => U
): ApiResult<U> {
  if (result.status === 'error') return result;
  return { status: 'ok', data: fn(result.data) };
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
