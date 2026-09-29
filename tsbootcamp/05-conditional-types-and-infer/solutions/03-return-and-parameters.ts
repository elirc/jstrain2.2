// ─────────────────────────────────────────────────────────────────────────
//  03 · MyReturnType & MyParameters — SOLUTION              ★★☆ core
//  run: node ../run.js solutions/03-return-and-parameters.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: both types match T against a function SHAPE and name one
//  hole in it.
//
//  · MyReturnType matches `(...args: never[]) => infer R`. Parameters are
//    checked contravariantly, so the pattern's parameter type has to be
//    something every function will accept — `never[]` (or `any[]`, which
//    is what lib.es5.d.ts uses) is the "I don't care, any parameter list
//    fits" wildcard. Write `(...args: string[]) => infer R` instead and
//    functions taking a number stop matching.
//  · MyParameters matches `(...args: infer P) => unknown` and keeps the
//    parameter list. P comes back as a TUPLE — labels and optionality
//    included — which is why the expected type reads [a: string, b:
//    number]. For a rest signature it comes back as number[], an array
//    rather than a tuple, and that difference matters in exercise 04.
//  · No match → never. `MyReturnType<string>` is never, not an error:
//    conditional types answer questions, they don't reject inputs. Add
//    `T extends (...args: never[]) => unknown` to the parameter list if
//    you want the call site to be rejected instead.
//
//  The builtins are the same two lines with `any` in the wildcard slots
//  and `any` (not never) as their fallback — compare and you have read
//  a real chunk of lib.es5.d.ts.

import { test, eq } from '../../_lib/check.ts';
import {
  use,
  type Expect,
  type Equal,
  type IsNever,
} from '../../_lib/type-assert.ts';

export type MyReturnType<T> = T extends (...args: never[]) => infer R ? R : never;
export type MyParameters<T> = T extends (...args: infer P) => unknown ? P : never;

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
