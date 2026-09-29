// ─────────────────────────────────────────────────────────────────────────
//  06 · recursive conditionals — SOLUTION                   ★★★ stretch
//  run: node ../run.js solutions/06-recursive-conditionals.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: trace DeepAwaited<Promise<Promise<Promise<string>>>>.
//
//    pass 1  T = Promise<Promise<Promise<string>>>
//            matches Promise<infer V> → V = Promise<Promise<string>>
//            true branch → DeepAwaited<Promise<Promise<string>>>
//    pass 2  V = Promise<string>          → DeepAwaited<Promise<string>>
//    pass 3  V = string                   → DeepAwaited<string>
//    pass 4  string does not match        → false branch → string
//
//  Four questions, one answer. The false branch is the base case; without
//  it (or with a recursive call on the SAME T) tsc hits its instantiation
//  depth limit and reports TS2589 instead of looping forever.
//
//  Flatten is the same shape over arrays, with two wrinkles:
//
//    Flatten<[1, [2, [3]]]>
//      matches readonly (infer E)[] → E = 1 | [2, [3]]      (a UNION —
//      a tuple's element type is the union of its members)
//      T is naked, so the recursive call distributes:
//        Flatten<1>        → 1
//        Flatten<[2, [3]]> → E = 2 | [3] → 2 | Flatten<[3]> → 2 | 3
//      union of answers → 1 | 2 | 3
//
//    Flatten<[]> → E = never (no elements) → Flatten<never> → distributing
//      over the empty union gives never. That's why the test asks IsNever.
//
//  Pattern `readonly (infer E)[]` covers mutable AND readonly arrays;
//  `(infer E)[]` alone would leave readonly arrays unflattened. And note
//  Flatten never touches Promise, DeepAwaited never touches arrays —
//  each stops at the pattern it was told to look for. (The builtin
//  Awaited<T> is DeepAwaited plus PromiseLike/thenable handling.)

import { test, eq } from '../../_lib/check.ts';
import {
  use,
  type Expect,
  type Equal,
  type IsNever,
} from '../../_lib/type-assert.ts';

export type DeepAwaited<T> = T extends Promise<infer V> ? DeepAwaited<V> : T;
export type Flatten<T> = T extends readonly (infer E)[] ? Flatten<E> : T;

// ─────────────────────────── runtime tests ───────────────────────────────

const leaf: Flatten<number[][]> = 3;

test('the type describes what awaiting really produces', async () => {
  const inner = Promise.resolve(7);
  const settled: DeepAwaited<Promise<Promise<number>>> = await inner;
  eq(settled, 7);
  eq(leaf, 3);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _d1 = Expect<Equal<DeepAwaited<Promise<Promise<Promise<string>>>>, string>>;
type _d2 = Expect<Equal<DeepAwaited<number>, number>>;
type _d3 = Expect<Equal<DeepAwaited<Promise<string[]>>, string[]>>;
// each union member is peeled on its own
type _d4 = Expect<Equal<DeepAwaited<Promise<string> | number>, string | number>>;
// an array of promises is not a promise — nothing to peel
type _d5 = Expect<Equal<DeepAwaited<Promise<number>[]>, Promise<number>[]>>;

type _f1 = Expect<Equal<Flatten<number[][][]>, number>>;
type _f2 = Expect<Equal<Flatten<string>, string>>;
type _f3 = Expect<Equal<Flatten<[1, [2, [3]]]>, 1 | 2 | 3>>;
type _f4 = Expect<Equal<Flatten<[number[], string[]]>, number | string>>;
type _f5 = Expect<Equal<Flatten<readonly (readonly boolean[])[]>, boolean>>;
// the empty tuple has no element type to recurse into
type _f6 = Expect<IsNever<Flatten<[]>>>;

function _typeTests() {
  // @ts-expect-error — DeepAwaited peels every layer, so this is number
  const still: DeepAwaited<Promise<Promise<number>>> = Promise.resolve(1);
  use(still);

  // @ts-expect-error — Flatten<number[][]> is number, not number[]
  const arr: Flatten<number[][]> = [1];
  use(arr);
}
use(_typeTests);
