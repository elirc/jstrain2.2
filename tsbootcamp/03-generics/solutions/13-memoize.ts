// ─────────────────────────────────────────────────────────────────────────
//  13 · memoize — SOLUTION                                ★★★ stretch
//  run: node ../run.js solutions/13-memoize.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `A extends unknown[]` is a type parameter that holds an
//  entire parameter LIST — `[a: number, b: number]` for the adder, `[]`
//  for the no-argument case. Writing the wrapper as `(...args: A) => R`
//  reproduces the original signature exactly: same arity, same parameter
//  types, same return type. The type tests prove it with
//  `Expect<Equal<typeof fast, (a: number, b: number) => number>>` — an
//  assertion `(...args: any[]) => any` could never pass.
//
//  Reusing A in `memoizeKeyed` is the real payoff: one parameter, two
//  function types, and the compiler now guarantees the key function is
//  fed exactly what the wrapped function is fed.
//
//  Runtime notes: `cache.has(key)` rather than `if (cache.get(key))`, or
//  a cached `0`/`undefined` recomputes forever. `JSON.stringify(args)` is
//  a fine default key for primitives and a trap for objects with
//  different key order — which is exactly why `memoizeKeyed` exists.

import { test, eq, spy } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export function memoize<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
  const cache = new Map<string, R>();
  return (...args: A): R => {
    const key = JSON.stringify(args);
    if (!cache.has(key)) cache.set(key, fn(...args));
    return cache.get(key) as R;
  };
}

export function memoizeKeyed<A extends unknown[], R>(
  fn: (...args: A) => R,
  keyOf: (...args: A) => string
): (...args: A) => R {
  const cache = new Map<string, R>();
  return (...args: A): R => {
    const key = keyOf(...args);
    if (!cache.has(key)) cache.set(key, fn(...args));
    return cache.get(key) as R;
  };
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('returns the same answer as the wrapped function', () => {
  const fast = memoize((a: number, b: number) => a + b);
  eq(fast(1, 2), 3);
});

test('calls the wrapped function once per distinct argument list', () => {
  const slow = spy((a: number, b: number) => a + b);
  const fast = memoize(slow);
  fast(1, 2);
  fast(1, 2);
  fast(2, 2);
  eq(slow.callCount, 2);
});

test('caches a falsy result instead of recomputing it', () => {
  const slow = spy((n: number) => n * 0);
  const fast = memoize(slow);
  eq(fast(5), 0);
  eq(fast(5), 0);
  eq(slow.callCount, 1);
});

test('works for a function with no arguments', () => {
  const slow = spy(() => 'boot');
  const fast = memoize(slow);
  eq(fast(), 'boot');
  eq(fast(), 'boot');
  eq(slow.callCount, 1);
});

test('memoizeKeyed shares an entry when the keys collide', () => {
  const lookup = spy((name: string) => `<${name}>`);
  const find = memoizeKeyed(lookup, (name: string) => name.toLowerCase());
  eq(find('Ada'), '<Ada>');
  eq(find('ADA'), '<Ada>');
  eq(lookup.callCount, 1);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<
  Equal<ReturnType<typeof memoize<[a: number], string>>, (a: number) => string>
>;

function _typeTests() {
  const fast = memoize((a: number, b: number) => a + b);
  type _f = Expect<Equal<typeof fast, (a: number, b: number) => number>>;
  use(fast);

  const value: number = fast(1, 2);
  use(value);

  // @ts-expect-error — the wrapper is not loosely typed; a string is a string
  fast('1', 2);

  // @ts-expect-error — and the arity survives too
  fast(1);

  const find = memoizeKeyed((name: string) => name.length, (name) => name.trim());
  type _k = Expect<Equal<typeof find, (name: string) => number>>;
  use(find);

  // @ts-expect-error — the key function sees the SAME arguments as the wrapped fn
  memoizeKeyed((name: string) => name.length, (id: number) => String(id));
}
use(_typeTests);
