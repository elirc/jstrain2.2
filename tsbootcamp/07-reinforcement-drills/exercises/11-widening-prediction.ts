// ─────────────────────────────────────────────────────────────────────────
//  11 · widening prediction                                 ★★☆ core
//  concepts: literal widening · as const · inference
//  run: node ../run.js exercises/11-widening-prediction.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  cold rep — you learned this in TS-01.
//
//  Eight declarations. For each one, write the type tsc infers — by hand.
//  Writing `type A1 = typeof level` compiles and teaches you nothing; the
//  point is to predict, then let the grader tell you.
//
//      const level = 'debug'   → A1 = ?
//      let mode = 'auto'       → A2 = ?
//
//  Read the whole list before you start; three of them catch most people.
//
//  The runtime tests pass from the first run. tsc is the whole todo list.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export const level = 'debug';

export let mode = 'auto';

export const flags = { verbose: true };

export const limits = { max: 10 } as const;

export const ids = [1, 2, 3];

export const pair = [1, 'two'] as const;

export function makeTag() {
  return { name: 'ops', hits: 0 };
}

export const conf = { retries: 3 as const, name: 'api' };

export type A1 = TODO; // const level = 'debug'
export type A2 = TODO; // let mode = 'auto'
export type A3 = TODO; // const flags = { verbose: true }
export type A4 = TODO; // const limits = { max: 10 } as const
export type A5 = TODO; // const ids = [1, 2, 3]
export type A6 = TODO; // const pair = [1, 'two'] as const
export type A7 = TODO; // what makeTag() returns
export type A8 = TODO; // const conf = { retries: 3 as const, name: 'api' }

// ─────────────────────────── runtime tests ───────────────────────────────

test('the scalars are what they look like', () => {
  eq(level, 'debug');
  eq(mode, 'auto');
});

test('the objects are what they look like', () => {
  eq(flags, { verbose: true });
  eq(limits.max, 10);
  eq(conf, { retries: 3, name: 'api' });
});

test('the arrays are what they look like', () => {
  eq(ids, [1, 2, 3]);
  eq(pair[1], 'two');
  eq(pair.length, 2);
});

test('as const is a compile-time thing, not Object.freeze', () => {
  eq(makeTag(), { name: 'ops', hits: 0 });
  ok(!Object.isFrozen(limits), 'as const does not freeze at runtime');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _a1 = Expect<Equal<A1, typeof level>>;
type _a2 = Expect<Equal<A2, typeof mode>>;
type _a3 = Expect<Equal<A3, typeof flags>>;
type _a4 = Expect<Equal<A4, typeof limits>>;
type _a5 = Expect<Equal<A5, typeof ids>>;
type _a6 = Expect<Equal<A6, typeof pair>>;
type _a7 = Expect<Equal<A7, ReturnType<typeof makeTag>>>;
type _a8 = Expect<Equal<A8, typeof conf>>;

function _typeTests() {
  mode = 'manual';
  flags.verbose = false;
  ids.push(4);

  // @ts-expect-error — as const made every property readonly
  limits.max = 11;

  // @ts-expect-error — and a readonly tuple has no writable slots
  pair[0] = 9;

  // @ts-expect-error — retries kept the literal type 3
  conf.retries = 4;

  conf.name = 'db';

  // @ts-expect-error — ids widened to number[], so strings are out
  ids.push('five');
}
use(_typeTests);
