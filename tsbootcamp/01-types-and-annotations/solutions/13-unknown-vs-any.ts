// ─────────────────────────────────────────────────────────────────────────
//  13 · unknown vs any — SOLUTION                           ★★☆ core
//  run: node ../run.js solutions/13-unknown-vs-any.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `unknown` is the top type — everything is assignable TO
//  it, and it is assignable to nothing until you narrow. That single
//  asymmetry is the whole feature. Each check in safePrint buys one
//  capability: after `value === null || value === undefined` the rest of
//  the function knows it holds something; after `typeof value ===
//  'string'` it can return the value directly; after
//  `Array.isArray(value)` it can read `.length`.
//
//  `any` is not the top type — it is a hole. It is assignable in BOTH
//  directions, which is why `unsafeLength` compiles and then dies on
//  null, and why any is contagious: one `any` flowing through a chain of
//  calls silently turns every downstream type into any.
//
//  The type test that matters here is `ExpectFalse<IsAny<...>>`. A
//  student who "fixes" the type errors by leaving the parameter as `any`
//  passes the runtime tests and fails that line. Use unknown at every
//  boundary — JSON.parse results, catch clauses, third-party payloads —
//  and narrow once, at the edge.

import { test, eq, throws } from '../../_lib/check.ts';
import {
  use,
  type Expect,
  type ExpectFalse,
  type Equal,
  type IsAny,
} from '../../_lib/type-assert.ts';

export function safePrint(value: unknown): string {
  if (value === null || value === undefined) return 'nothing';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === 'object') return '[object]';
  return String(value);
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
