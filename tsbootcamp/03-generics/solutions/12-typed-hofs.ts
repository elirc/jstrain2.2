// ─────────────────────────────────────────────────────────────────────────
//  12 · compose2, once, tap — SOLUTION                    ★★★ stretch
//  run: node ../run.js solutions/12-typed-hofs.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `compose2<A, B, C>` names the three types in the pipeline
//  — input, handoff, output — and writes them down in the order the data
//  moves: g takes A and produces B, f takes B and produces C, the result
//  takes A and produces C. B never appears in the returned function's
//  type; it exists only to force the two halves to line up, which is what
//  makes the mismatched pair a compile error instead of a runtime one.
//
//  `once` and `tap` are "shape preserving" wrappers. `A extends
//  unknown[]` captures a whole parameter LIST as one type parameter, so
//  `(...args: A) => R` gives back a function with the same arity, the
//  same parameter types and the same result. `any[]` would work too and
//  would also let `boot('db', 'twice')` through.
//
//  `result` is declared without an initializer and read inside the
//  closure: TS does not run definite-assignment analysis across a
//  callback, so no `!` is needed. The `called` flag (not a truthiness
//  check on `result`) is what makes `once(() => undefined)` behave.
//
//  `tap`'s callback returns `void`, which in TS means "I ignore whatever
//  you return" — so `(a) => a.sort()` is accepted without complaint.

import { test, eq, ok, spy } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export function compose2<A, B, C>(f: (b: B) => C, g: (a: A) => B): (a: A) => C {
  return (a: A): C => f(g(a));
}

export function once<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
  let called = false;
  let result: R;
  return (...args: A): R => {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  };
}

export function tap<T>(value: T, fn: (value: T) => void): T {
  fn(value);
  return value;
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('compose2 runs right to left', () => {
  const shout = compose2((s: string) => `${s}!`, (n: number) => `#${n}`);
  eq(shout(2), '#2!');
});

test('compose2 with two number steps', () => {
  const addThenDouble = compose2((n: number) => n * 2, (n: number) => n + 1);
  eq(addThenDouble(3), 8);
});

test('once calls the wrapped function a single time', () => {
  const init = spy((label: string) => `${label}-1`);
  const boot = once(init);
  boot('db');
  boot('db');
  boot('cache');
  eq(init.callCount, 1);
});

test('once replays the first result, even when it is undefined', () => {
  const boot = once(() => undefined);
  eq(boot(), undefined);
  eq(boot(), undefined);
});

test('tap gives back the very same value', () => {
  const items = [3, 1, 2];
  ok(tap(items, (a: number[]) => a.sort()) === items);
});

test('tap runs the side effect', () => {
  const seen: number[] = [];
  tap(7, (n: number) => seen.push(n));
  eq(seen, [7]);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<
  Equal<ReturnType<typeof compose2<number, string, boolean>>, (a: number) => boolean>
>;
type _r2 = Expect<Equal<ReturnType<typeof tap<string[]>>, string[]>>;

function _typeTests() {
  const shout = compose2((s: string) => `${s}!`, (n: number) => `#${n}`);
  type _c = Expect<Equal<typeof shout, (a: number) => string>>;
  use(shout);

  // @ts-expect-error — g returns a string, so f must accept a string
  compose2((n: number) => n + 1, (s: string) => s);

  const boot = once((label: string, retries: number) => label.length + retries);
  type _o = Expect<Equal<typeof boot, (label: string, retries: number) => number>>;
  use(boot);

  // @ts-expect-error — the wrapper keeps the exact parameter list
  boot('db', 'twice');

  const sorted = tap([3, 1], (a) => a.sort());
  type _t = Expect<Equal<typeof sorted, number[]>>;
  use(sorted);

  // @ts-expect-error — tap hands the callback the value, and 7 has no .sort
  tap(7, (n) => n.sort());
}
use(_typeTests);
