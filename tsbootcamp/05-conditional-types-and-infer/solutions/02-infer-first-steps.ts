// ─────────────────────────────────────────────────────────────────────────
//  02 · infer, first steps — SOLUTION                       ★★☆ core
//  run: node ../run.js solutions/02-infer-first-steps.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: read `T extends (infer E)[] ? E : T` as a pattern match.
//  tsc tries to line T up with the shape `SOMETHING[]`; if it fits, the
//  hole gets a name (E) that only exists inside the true branch.
//
//  · UnwrapArray<Promise<string>[]> matches with E = Promise<string> —
//    it peels ONE layer, no more. Recursion (exercise 06) is what turns
//    one peel into all of them.
//  · UnwrapPromise<Promise<Promise<1>>> gives Promise<1> for the same
//    reason: one question, one answer.
//  · The false branch is a design decision, not a rule. UnwrapArray
//    returns T unchanged ("nothing to unwrap here"), ElementOf returns
//    never ("you asked for an element of a non-array — there is no such
//    type"). Both are used in the wild; pick per call site.
//  · `(infer E)[]` only matches MUTABLE arrays. `readonly string[]` is
//    not assignable to `string[]` (that's the whole point of readonly),
//    so it falls to the false branch. `readonly (infer E)[]` matches
//    both, which is why ElementOf takes it and UnwrapArray does not.
//
//  The empty tuple is the edge that catches sloppy versions: ElementOf<[]>
//  matches, but the element type of a tuple with no elements is never.

import { test, eq } from '../../_lib/check.ts';
import {
  use,
  type Expect,
  type Equal,
  type IsNever,
} from '../../_lib/type-assert.ts';

export type UnwrapArray<T> = T extends (infer E)[] ? E : T;
export type UnwrapPromise<T> = T extends Promise<infer V> ? V : T;
export type ElementOf<T> = T extends readonly (infer E)[] ? E : never;

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
