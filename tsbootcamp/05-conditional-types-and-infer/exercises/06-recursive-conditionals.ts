// ─────────────────────────────────────────────────────────────────────────
//  06 · recursive conditionals                              ★★★ stretch
//  concepts: recursion in type land · base case · self-reference
//  run: node ../run.js exercises/06-recursive-conditionals.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Exercise 02 peeled one layer. A conditional type may reference ITSELF
//  in its branches, which turns one peel into "keep peeling until the
//  pattern stops matching" — the false branch is the base case.
//
//      DeepAwaited<Promise<Promise<Promise<string>>>>  → string
//      DeepAwaited<number>                             → number
//      Flatten<number[][][]>                           → number
//      Flatten<[1, [2, [3]]]>                          → 1 | 2 | 3
//      Flatten<string>                                 → string
//
//  Flatten must handle readonly arrays too, and must NOT flatten a
//  promise (that's DeepAwaited's job) — the tests check both.
//
//  hint: the recursive call goes in the TRUE branch, on what infer bound

import { test, eq } from '../../_lib/check.ts';
import {
  use,
  type Expect,
  type Equal,
  type IsNever,
} from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type DeepAwaited<T> = TODO;
export type Flatten<T> = TODO;

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
