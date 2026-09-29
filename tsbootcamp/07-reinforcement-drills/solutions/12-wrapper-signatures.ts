// ─────────────────────────────────────────────────────────────────────────
//  12 · wrapper signatures — SOLUTION                       ★★★ stretch
//  run: node ../run.js solutions/12-wrapper-signatures.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a wrapper is only useful if the wrapped function is still
//  callable the same way. Two spellings do that, and they are not quite
//  the same thing.
//
//  1. Capture the whole function: `F extends (...args: any[]) => any`,
//     then take it apart with `Parameters<F>` and `ReturnType<F>`. This is
//     the one to reach for when you also need F itself (to store it, to
//     name it in an error message).
//
//  2. Capture the PIECES: `<A extends unknown[], R>` with
//     `fn: (...args: A) => R`. Inference fills A with the argument tuple
//     and R with the return type, and the result `(...args: A) => R` is
//     literally the same signature you were given.
//
//  The difference shows up in the type tests. `(...args: Parameters<F>) =>
//  ReturnType<F>` behaves identically at every call site, but it is not
//  IDENTICAL to `(a: number, b: string) => boolean` as far as the Equal
//  trick is concerned — you have to compare Parameters and ReturnType
//  separately. The tuple-parameter version compares equal outright. Worth
//  knowing the day a strict library type refuses your wrapper.
//
//  `...args: any[]` in the CONSTRAINT is not the `any` you are warned
//  about: nothing is typed `any`, it only says "some function". The strict
//  alternative is `(...args: never[]) => unknown`.
//
//  memoizeWeak: a WeakMap keys on object identity and lets the entry die
//  with the key, which is why `A extends object`. Note `cache.has(arg)` in
//  the lookup — without it a cached `undefined` recomputes forever, and
//  that bug survives every test that only caches truthy values.

import { test, eq, ok, spy } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export function isPositive(a: number, b: string): boolean {
  return a > 0 && b !== '';
}

export function wrap<F extends (...args: any[]) => any>(
  fn: F,
  onCall: (args: Parameters<F>) => void
): (...args: Parameters<F>) => ReturnType<F> {
  return (...args: Parameters<F>): ReturnType<F> => {
    onCall(args);
    return fn(...args);
  };
}

export function after<A extends unknown[], R>(
  fn: (...args: A) => R,
  onResult: (result: R) => void
): (...args: A) => R {
  return (...args: A): R => {
    const result = fn(...args);
    onResult(result);
    return result;
  };
}

export function memoizeWeak<A extends object, R>(
  fn: (arg: A) => R
): (arg: A) => R {
  const cache = new WeakMap<A, R>();
  return (arg: A): R => {
    if (cache.has(arg)) return cache.get(arg) as R;
    const result = fn(arg);
    cache.set(arg, result);
    return result;
  };
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('wrap passes every argument through and returns the result', () => {
  const wrapped = wrap(isPositive, () => {});
  eq(wrapped(3, 'x'), true);
  eq(wrapped(-1, 'x'), false);
});

test('wrap hands the whole argument tuple to the callback', () => {
  const seen: unknown[][] = [];
  const wrapped = wrap(isPositive, (args: unknown[]) => {
    seen.push(args);
  });
  wrapped(3, 'x');
  eq(seen, [[3, 'x']]);
});

test('after observes the result without changing it', () => {
  const results: boolean[] = [];
  const watched = after(isPositive, (result: boolean) => {
    results.push(result);
  });
  eq(watched(3, 'x'), true);
  eq(results, [true]);
});

test('memoizeWeak calls the wrapped function once per object', () => {
  const double = spy((o: { n: number }) => o.n * 2);
  const memo = memoizeWeak(double);
  const key = { n: 21 };
  eq(memo(key), 42);
  eq(memo(key), 42);
  eq(double.callCount, 1);
});

test('a different object is a different key', () => {
  const double = spy((o: { n: number }) => o.n * 2);
  const memo = memoizeWeak(double);
  eq(memo({ n: 1 }), 2);
  eq(memo({ n: 1 }), 2);
  eq(double.callCount, 2);
});

test('a cached undefined is still a cache hit', () => {
  const nothing = spy((_o: { n: number }) => undefined);
  const memo = memoizeWeak(nothing);
  const key = { n: 1 };
  ok(memo(key) === undefined);
  ok(memo(key) === undefined);
  eq(nothing.callCount, 1);
});

// ──────────────────────────── type tests ─────────────────────────────────

type Wrapped = ReturnType<typeof wrap<typeof isPositive>>;

type _t1 = Expect<Equal<Parameters<Wrapped>, [a: number, b: string]>>;
type _t2 = Expect<Equal<ReturnType<Wrapped>, boolean>>;

function _typeTests() {
  const wrapped = wrap(isPositive, (args) => {
    const first: number = args[0];
    use(first);
  });
  const result: boolean = wrapped(3, 'x');
  use(result);

  // @ts-expect-error — the wrapped signature is exactly the original
  wrapped('3', 'x');

  // @ts-expect-error — arity included
  wrapped(3);

  const watched = after(isPositive, (r) => use(r));
  type _a1 = Expect<Equal<typeof watched, (a: number, b: string) => boolean>>;
  use(watched(3, 'x'));

  // @ts-expect-error — after's callback receives the return type
  after(isPositive, (r: string) => use(r));

  const memo = memoizeWeak((o: { n: number }) => o.n * 2);
  type _m1 = Expect<Equal<typeof memo, (arg: { n: number }) => number>>;
  const doubled: number = memo({ n: 1 });
  use(doubled);

  // @ts-expect-error — a WeakMap key must be an object
  memoizeWeak((n: number) => n * 2);

  // @ts-expect-error — and the memoised call keeps the parameter type
  memo(21);
}
use(_typeTests);
