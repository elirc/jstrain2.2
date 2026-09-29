// ─────────────────────────────────────────────────────────────────────────
//  12 · compose2, once, tap                               ★★★ stretch
//  concepts: typing higher-order functions · inference through callbacks
//  run: node ../run.js exercises/12-typed-hofs.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  When a function takes or returns functions, the type parameters trace
//  the data flowing through them.
//
//      compose2(f, g)(a)  ===  f(g(a))
//
//      const shout = compose2((s: string) => s + '!', (n: number) => `#${n}`);
//      shout(2)           → '#2!'      typed (a: number) => string
//
//      const boot = once(() => Date.now());   runs once, replays forever
//      tap([3, 1], (a) => a.sort())           → the same array, sorted
//
//  Three parameters for `compose2`: A goes in, B is the handoff between
//  the two functions, C comes out. `once` and `tap` keep the shape they
//  were given — `once` must accept ANY argument list, which is what
//  `A extends unknown[]` plus `(...args: A) => R` is for.
//
//  hint: `tap` returns the value it was handed, so the callback's return
//  type is irrelevant — say `void` and it can return anything

import { test, eq, ok, spy } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export function compose2(f: TODO, g: TODO): TODO {
  throw new Error('TODO');
}

export function once(fn: TODO): TODO {
  throw new Error('TODO');
}

export function tap(value: TODO, fn: TODO): TODO {
  throw new Error('TODO');
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
