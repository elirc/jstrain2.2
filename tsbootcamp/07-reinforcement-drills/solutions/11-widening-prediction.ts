// ─────────────────────────────────────────────────────────────────────────
//  11 · widening prediction — SOLUTION                      ★★☆ core
//  run: node ../run.js solutions/11-widening-prediction.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: one rule with a few consequences. A literal type widens
//  to its base type at every position that could later be reassigned.
//
//    A1  const + literal → the literal survives ('debug', not string).
//    A2  let + literal → widens immediately. The variable is mutable, so
//        keeping 'auto' would make the next assignment an error.
//    A3  object PROPERTIES are mutable, so they widen too — even inside a
//        const. `const flags = { verbose: true }` is `{ verbose: boolean }`,
//        and this is the single most common surprise in the list.
//    A4  `as const` turns off widening everywhere below it and adds
//        readonly to every property.
//    A5  array literals widen their elements and stay mutable arrays:
//        number[], never a tuple.
//    A6  `as const` on an array gives a READONLY TUPLE: positions and
//        literals both survive. This is why action/route tables use it.
//    A7  a return position widens like a let: the returned object literal
//        is { name: string; hits: number }.
//    A8  widening is per-property: `3 as const` keeps that one literal
//        while `name` still widens to string.
//
//  The practical version: if a value has to survive into a type, say
//  `as const`; if it has to be reassigned, let it widen. Everything else
//  follows from those two.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

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

export type A1 = 'debug';
export type A2 = string;
export type A3 = { verbose: boolean };
export type A4 = { readonly max: 10 };
export type A5 = number[];
export type A6 = readonly [1, 'two'];
export type A7 = { name: string; hits: number };
export type A8 = { retries: 3; name: string };

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
