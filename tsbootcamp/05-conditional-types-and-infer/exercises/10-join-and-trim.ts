// ─────────────────────────────────────────────────────────────────────────
//  10 · Join & Trim                                         ★★★ stretch
//  concepts: recursion that BUILDS a string · patterns anchored right
//  run: node ../run.js exercises/10-join-and-trim.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Exercise 09 took strings apart. Now put them back together, and eat
//  whitespace from the other end.
//
//      Join<['a', 'b', 'c'], '-'>  → 'a-b-c'
//      Join<['a'], '-'>            → 'a'        (no trailing delimiter!)
//      Join<[], '-'>               → ''
//      TrimRight<'hi  '>           → 'hi'
//      TrimRight<'  hi'>           → '  hi'     (left side untouched)
//      Trim<'  hi \n'>             → 'hi'
//
//  TrimLeft is provided — build Trim by composing, not by rewriting.
//
//  hint: `infer H extends string` narrows an inferred piece so you can
//        drop it straight into a `${...}` template

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

// provided — exercise 09's answer, plus the whitespace it eats
type Whitespace = ' ' | '\n' | '\t';
type TrimLeft<S extends string> = S extends `${Whitespace}${infer R}` ? TrimLeft<R> : S;

type TODO = any; // replace every TODO below with real types

export type Join<T extends string[], D extends string> = TODO;
export type TrimRight<S extends string> = TODO;
export type Trim<S extends string> = TODO;

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
