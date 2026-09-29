// ─────────────────────────────────────────────────────────────────────────
//  13 · memoize                                           ★★★ stretch
//  concepts: capturing a parameter list · signature-preserving wrappers
//  run: node ../run.js exercises/13-memoize.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  A cache in front of a pure function. The runtime part is six lines;
//  the type part is the point — the wrapper has to come back with the
//  SAME signature it was handed, or every call site downstream loses its
//  types.
//
//      const slow = (a: number, b: number) => a + b;
//      const fast = memoize(slow);
//      fast(1, 2)   → 3   typed (a: number, b: number) => number
//      fast(1, 2)   → 3   from the cache, slow never runs again
//
//  `memoizeKeyed` takes the key function as a second argument — and that
//  key function must accept the same arguments as the wrapped one:
//
//      const find = memoizeKeyed(lookup, (name) => name.toLowerCase());
//      find('Ada') and find('ADA') hit the same cache entry
//
//  hint: `A extends unknown[]` holds a whole parameter list; reuse the
//  same A in both function types and TS keeps them in step

import { test, eq, spy } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export function memoize(fn: TODO): TODO {
  throw new Error('TODO');
}

export function memoizeKeyed(fn: TODO, keyOf: TODO): TODO {
  throw new Error('TODO');
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
