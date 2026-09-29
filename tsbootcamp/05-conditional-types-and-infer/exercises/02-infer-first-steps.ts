// ─────────────────────────────────────────────────────────────────────────
//  02 · infer, first steps                                  ★★☆ core
//  concepts: infer · pattern matching · readonly arrays
//  run: node ../run.js exercises/02-infer-first-steps.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  `infer E` declares a type variable INSIDE the question: "does T look
//  like an array of something? if so, call that something E". Whatever
//  matched is then usable in the true branch.
//
//      UnwrapArray<string[]>               → string
//      UnwrapArray<number>                 → number   (no match → as-is)
//      UnwrapPromise<Promise<number>>      → number
//      UnwrapPromise<Promise<Promise<1>>>  → Promise<1>   (ONE level)
//      ElementOf<readonly string[]>        → string
//      ElementOf<number>                   → never    (no match → never)
//
//  ElementOf must also accept readonly arrays — UnwrapArray does not,
//  and one of the tests below pins that difference down.
//
//  hint: `readonly (infer E)[]` matches both `T[]` and `readonly T[]`

import { test, eq } from '../../_lib/check.ts';
import {
  use,
  type Expect,
  type Equal,
  type IsNever,
} from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type UnwrapArray<T> = TODO;
export type UnwrapPromise<T> = TODO;
export type ElementOf<T> = TODO;

// ─────────────────────────── runtime tests ───────────────────────────────

const name: UnwrapArray<string[]> = 'ada';
const port: ElementOf<readonly number[]> = 5432;

test('the unwrapped values are plain values at runtime', () => {
  eq(name, 'ada');
  eq(port, 5432);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _u1 = Expect<Equal<UnwrapArray<string[]>, string>>;
type _u2 = Expect<Equal<UnwrapArray<number>, number>>;
type _u3 = Expect<Equal<UnwrapArray<Promise<string>[]>, Promise<string>>>;
type _u4 = Expect<Equal<UnwrapArray<[1, 'a']>, 1 | 'a'>>;
// a readonly array is NOT assignable to (infer E)[] — no match, as-is
type _u5 = Expect<Equal<UnwrapArray<readonly string[]>, readonly string[]>>;

type _p1 = Expect<Equal<UnwrapPromise<Promise<number>>, number>>;
type _p2 = Expect<Equal<UnwrapPromise<Promise<Promise<1>>>, Promise<1>>>;
type _p3 = Expect<Equal<UnwrapPromise<string>, string>>;

type _e1 = Expect<Equal<ElementOf<readonly string[]>, string>>;
type _e2 = Expect<Equal<ElementOf<string[]>, string>>;
type _e3 = Expect<IsNever<ElementOf<number>>>;
type _e4 = Expect<IsNever<ElementOf<[]>>>;

function _typeTests() {
  const v: UnwrapPromise<Promise<number>> = 42;
  use(v);

  // @ts-expect-error — unwrapping Promise<number> gives number, not string
  const bad: UnwrapPromise<Promise<number>> = 'nope';
  use(bad);
}
use(_typeTests);
