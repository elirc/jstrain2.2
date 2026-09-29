// ─────────────────────────────────────────────────────────────────────────
//  03 · MyReturnType & MyParameters                         ★★☆ core
//  concepts: infer in function signatures · builtin utility types
//  run: node ../run.js exercises/03-return-and-parameters.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Rebuild two of the utility types you already use daily. Both are one
//  conditional with one infer — the trick is what to put in the OTHER
//  positions of the function shape you match against.
//
//      MyReturnType<() => string>              → string
//      MyReturnType<(a: number) => boolean>    → boolean
//      MyReturnType<string>                    → never  (not a function)
//      MyParameters<(a: string, b: number) => void>  → [a: string, b: number]
//      MyParameters<() => void>                → []
//      MyParameters<(...xs: number[]) => void> → number[]
//
//  A test compares each one to the builtin — they must agree exactly.
//
//  hint: a rest parameter can hold a whole tuple: (...args: infer P)

import { test, eq } from '../../_lib/check.ts';
import {
  use,
  type Expect,
  type Equal,
  type IsNever,
} from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type MyReturnType<T> = TODO;
export type MyParameters<T> = TODO;

// ─────────────────────────── runtime tests ───────────────────────────────

const parse = (s: string) => Number.parseInt(s, 10);

const parsed: MyReturnType<typeof parse> = parse('42');
const args: MyParameters<typeof parse> = ['42'];

test('the derived types describe the real function', () => {
  eq(parsed, 42);
  eq(args, ['42']);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<Equal<MyReturnType<() => string>, string>>;
type _r2 = Expect<Equal<MyReturnType<(a: number, b: string) => boolean>, boolean>>;
type _r3 = Expect<Equal<MyReturnType<() => void>, void>>;
type _r4 = Expect<IsNever<MyReturnType<string>>>;
// must agree with the builtin, character for character
type _r5 = Expect<Equal<MyReturnType<typeof parse>, ReturnType<typeof parse>>>;

type _p1 = Expect<Equal<MyParameters<(a: string, b: number) => void>, [a: string, b: number]>>;
type _p2 = Expect<Equal<MyParameters<() => void>, []>>;
type _p3 = Expect<Equal<MyParameters<(...xs: number[]) => void>, number[]>>;
type _p4 = Expect<IsNever<MyParameters<{ a: 1 }>>>;
type _p5 = Expect<Equal<MyParameters<typeof parse>, Parameters<typeof parse>>>;

function _typeTests() {
  const n: MyReturnType<typeof parse> = 1;
  use(n);

  // @ts-expect-error — parse takes a string, so [42] is not its parameters
  const wrong: MyParameters<typeof parse> = [42];
  use(wrong);
}
use(_typeTests);
