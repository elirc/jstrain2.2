// ─────────────────────────────────────────────────────────────────────────
//  10 · Join & Trim — SOLUTION                              ★★★ stretch
//  run: node ../run.js solutions/10-join-and-trim.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: trace Join<['a', 'b', 'c'], '-'>.
//
//    pass 1  T = ['a','b','c'] → H = 'a', R = ['b','c']
//            R is not [] → `a-${Join<['b','c'], '-'>}`
//    pass 2  T = ['b','c']     → H = 'b', R = ['c']
//            R is not [] → `b-${Join<['c'], '-'>}`
//    pass 3  T = ['c']         → H = 'c', R = []
//            R IS [] → 'c'          ← the no-trailing-delimiter case
//    pass 4  never happens; the empty tuple only matches the outer base
//    unwind  'c' → 'b-c' → 'a-b-c'
//
//  Two base cases, and both matter. `R extends []` stops one step early
//  so the last piece arrives without a delimiter glued to it; the outer
//  `: ''` catches Join<[], D>. Drop the first and you get 'a-b-c-';
//  drop the second and Join<[], '-'> becomes never, which then poisons
//  every template it touches.
//
//  `infer H extends string` is the piece worth stealing. Inference alone
//  gives H type `unknown` as far as the template is concerned, and
//  `${H}` refuses non-stringable types; the `extends string` clause
//  narrows the inferred type in place (TS 4.8+) instead of forcing an
//  `H & string` intersection or a second nested conditional.
//
//  TrimRight is TrimLeft with the pattern anchored on the other side:
//
//    TrimRight<' hi \n\t'>  → `${infer R}${'\t'}`  R = ' hi \n'
//                           → `${infer R}${'\n'}`  R = ' hi '
//                           → `${infer R}${' '}`   R = ' hi'
//                           → nothing matches at the end → ' hi'
//
//  and Trim is just the two composed — TrimLeft<TrimRight<S>>. Composing
//  finished helpers instead of writing a third recursion is the whole
//  point; type land rewards it the same way value land does.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

// provided — exercise 09's answer, plus the whitespace it eats
type Whitespace = ' ' | '\n' | '\t';
type TrimLeft<S extends string> = S extends `${Whitespace}${infer R}` ? TrimLeft<R> : S;

export type Join<T extends string[], D extends string> = T extends [
  infer H extends string,
  ...infer R extends string[],
]
  ? R extends []
    ? H
    : `${H}${D}${Join<R, D>}`
  : '';
export type TrimRight<S extends string> = S extends `${infer R}${Whitespace}` ? TrimRight<R> : S;
export type Trim<S extends string> = TrimLeft<TrimRight<S>>;

// ─────────────────────────── runtime tests ───────────────────────────────

const joined: Join<['a', 'b', 'c'], '-'> = 'a-b-c';
const clean: Trim<'  hi \n'> = 'hi';

test('the built-up types hold exactly those strings', () => {
  eq(joined, 'a-b-c');
  eq(joined.split('-').length, 3);
  eq(clean, 'hi');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _j1 = Expect<Equal<Join<['a', 'b', 'c'], '-'>, 'a-b-c'>>;
// one element means zero delimiters
type _j2 = Expect<Equal<Join<['a'], '-'>, 'a'>>;
type _j3 = Expect<Equal<Join<[], '-'>, ''>>;
type _j4 = Expect<Equal<Join<['a', 'b'], ''>, 'ab'>>;
type _j5 = Expect<Equal<Join<['x', 'y', 'z'], '/'>, 'x/y/z'>>;
type _j6 = Expect<Equal<Join<['2026', '08', '20'], '-'>, '2026-08-20'>>;

type _r1 = Expect<Equal<TrimRight<'hi  '>, 'hi'>>;
type _r2 = Expect<Equal<TrimRight<'  hi'>, '  hi'>>;
type _r3 = Expect<Equal<TrimRight<''>, ''>>;
type _r4 = Expect<Equal<TrimRight<' hi \n\t'>, ' hi'>>;

type _t1 = Expect<Equal<Trim<'  hi \n'>, 'hi'>>;
type _t2 = Expect<Equal<Trim<''>, ''>>;
type _t3 = Expect<Equal<Trim<'   '>, ''>>;
type _t4 = Expect<Equal<Trim<'a b'>, 'a b'>>;

// @ts-expect-error — Join only joins strings
type _bad = Join<[1, 2], '-'>;

function _typeTests() {
  // @ts-expect-error — the delimiter goes BETWEEN the pieces: 'a-b'
  const wrong: Join<['a', 'b'], '-'> = 'ab';
  use(wrong);
}
use(_typeTests);
