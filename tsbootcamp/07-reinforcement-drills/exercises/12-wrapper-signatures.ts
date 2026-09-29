// ─────────────────────────────────────────────────────────────────────────
//  12 · wrapper signatures                                  ★★★ stretch
//  concepts: Parameters · ReturnType · argument tuples
//  run: node ../run.js exercises/12-wrapper-signatures.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  cold rep — you learned this in TS-03 and TS-05.
//
//  Three wrappers. Each must hand back a function callable EXACTLY like
//  the one it was given — same arity, same argument types, same result.
//
//      wrap(fn, onCall)      call the callback with the argument tuple
//      after(fn, onResult)   call the callback with the return value
//      memoizeWeak(fn)       cache by object identity, one argument
//
//  Spec for the signatures:
//      wrap        take the whole function: F extends (...args: any[]) => any
//      after       take the pieces: <A extends unknown[], R>
//      memoizeWeak one object argument in, its result out
//
//  Only one of those two spellings compares equal to the original
//  signature under Expect<Equal>. The type tests will show you which.

import { test, eq, ok, spy } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export function isPositive(a: number, b: string): boolean {
  return a > 0 && b !== '';
}

export function wrap(fn: TODO, onCall: TODO): TODO {
  throw new Error('TODO');
}

export function after(fn: TODO, onResult: TODO): TODO {
  throw new Error('TODO');
}

export function memoizeWeak(fn: TODO): TODO {
  throw new Error('TODO');
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
