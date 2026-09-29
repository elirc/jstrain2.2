// ─────────────────────────────────────────────────────────────────────────
//  13 · unknown vs any                                      ★★☆ core
//  concepts: unknown · any · narrowing before use
//  run: node ../run.js exercises/13-unknown-vs-any.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  `any` switches the compiler off for that value and everything it
//  touches. `unknown` is the honest version of the same idea: it accepts
//  every value, and lets you do NOTHING with it until you have proved
//  what it is. Same input, opposite risk.
//
//  Write safePrint so it takes an unknown and always returns a string:
//
//      safePrint('hi')       → 'hi'
//      safePrint(42)         → '42'
//      safePrint(true)       → 'true'
//      safePrint(null)       → 'nothing'
//      safePrint(undefined)  → 'nothing'
//      safePrint([1, 2, 3])  → '[3 items]'
//      safePrint({ a: 1 })   → '[object]'
//
//  `unsafeLength` below is the counter-example and is already written —
//  read it, then look at what its runtime test proves.
//
//  hint: check null/undefined first, then `typeof value === 'string'`,
//  then `Array.isArray(value)` — each check teaches the compiler
//  something it will let you use

import { test, eq, throws } from '../../_lib/check.ts';
import {
  use,
  type Expect,
  type ExpectFalse,
  type Equal,
  type IsAny,
} from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export function safePrint(value: TODO): TODO {
  throw new Error('TODO');
}

// the counter-example: `any` compiles happily and fails at runtime
export function unsafeLength(value: any): number {
  return value.length;
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('safePrint passes strings through', () => {
  eq(safePrint('hi'), 'hi');
});

test('safePrint stringifies primitives', () => {
  eq(safePrint(42), '42');
  eq(safePrint(true), 'true');
});

test('safePrint reports nothing for null and undefined', () => {
  eq(safePrint(null), 'nothing');
  eq(safePrint(undefined), 'nothing');
});

test('safePrint counts array elements', () => {
  eq(safePrint([1, 2, 3]), '[3 items]');
  eq(safePrint([]), '[0 items]');
});

test('safePrint labels other objects', () => {
  eq(safePrint({ a: 1 }), '[object]');
});

test('unsafeLength type-checks, then throws on null', () => {
  eq(unsafeLength('abc'), 3);
  throws(() => unsafeLength(null), 'null');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _1 = Expect<Equal<Parameters<typeof safePrint>[0], unknown>>;
type _2 = ExpectFalse<IsAny<Parameters<typeof safePrint>[0]>>;
type _3 = Expect<Equal<ReturnType<typeof safePrint>, string>>;

function _typeTests() {
  // unknown accepts every value — that part is like any
  safePrint('hi');
  safePrint(42);
  safePrint(null);
  safePrint({ deeply: { nested: true } });

  const mystery: unknown = 'hi';
  // @ts-expect-error — an unknown must be narrowed before you touch it
  mystery.toUpperCase();

  const anything: any = 'hi';
  anything.noSuchMethod(); // any compiles… and blows up at runtime

  // @ts-expect-error — safePrint always hands back a string
  const n: number = safePrint('hi');
  use(n);
}
use(_typeTests);
