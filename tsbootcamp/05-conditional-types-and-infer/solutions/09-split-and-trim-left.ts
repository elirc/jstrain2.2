// ─────────────────────────────────────────────────────────────────────────
//  09 · Split & TrimLeft — SOLUTION                         ★★★ stretch
//  run: node ../run.js solutions/09-split-and-trim-left.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: trace Split<'a,b,c', ','>.
//
//    pass 1  S = 'a,b,c'  matches `${infer Head}${','}${infer Tail}`
//            Head = 'a', Tail = 'b,c'   → ['a', ...Split<'b,c', ','>]
//    pass 2  S = 'b,c'    Head = 'b', Tail = 'c'
//                                       → ['b', ...Split<'c', ','>]
//    pass 3  S = 'c'      no comma in it → base case → ['c']
//    unwind  ['c'] → ['b', 'c'] → ['a', 'b', 'c']
//
//  Matching is LEFTMOST and non-greedy for the first hole, which is what
//  makes 'a,,b' come out as ['a', '', 'b'] — pass 2 sees ',b', binds
//  Head = '' and Tail = 'b'. The empty piece is real data, not a bug.
//
//  The base case is `[S]`, not `[]`. "No delimiter left" means one piece
//  remains, and that is also why Split<'', ','> is [''] — one empty
//  piece, exactly like ''.split(',') at runtime.
//
//  TrimLeft is the same idea with a union in the pattern:
//
//    TrimLeft<'\n\t hi '>  → matches `${'\n'}${infer R}`  R = '\t hi '
//                          → matches `${'\t'}${infer R}`  R = ' hi '
//                          → matches `${' '}${infer R}`   R = 'hi '
//                          → 'hi ' starts with none of them → done
//
//  tsc tries each member of Whitespace, so one pattern covers all three
//  characters. Nothing eats from the right — TrimRight (exercise 10) is
//  the mirror image, and Trim is the two composed.
//
//  Danger zone: `Split<S, ''>` with an EMPTY delimiter degenerates into
//  `${infer H}${infer T}` and splits per character, which is fine here
//  but is the shape that runs away in a sloppier type — always make sure
//  the recursive call gets a strictly shorter string.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

// provided — the characters TrimLeft should eat
type Whitespace = ' ' | '\n' | '\t';

export type Split<S extends string, D extends string> = S extends `${infer Head}${D}${infer Tail}`
  ? [Head, ...Split<Tail, D>]
  : [S];
export type TrimLeft<S extends string> = S extends `${Whitespace}${infer R}` ? TrimLeft<R> : S;

// ─────────────────────────── runtime tests ───────────────────────────────

const parts: Split<'a,b,c', ','> = ['a', 'b', 'c'];
const trimmed: TrimLeft<'  hi'> = 'hi';

test('the type-level split matches the runtime split', () => {
  eq(parts, ['a', 'b', 'c']);
  eq(parts.join(','), 'a,b,c');
  eq(trimmed, 'hi');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _s1 = Expect<Equal<Split<'a,b,c', ','>, ['a', 'b', 'c']>>;
type _s2 = Expect<Equal<Split<'a', ','>, ['a']>>;
// the empty string is one empty piece, not zero pieces
type _s3 = Expect<Equal<Split<'', ','>, ['']>>;
type _s4 = Expect<Equal<Split<'a--b', '--'>, ['a', 'b']>>;
type _s5 = Expect<Equal<Split<'a,,b', ','>, ['a', '', 'b']>>;
type _s6 = Expect<Equal<Split<'2026-08-20', '-'>, ['2026', '08', '20']>>;

type _t1 = Expect<Equal<TrimLeft<'  hi'>, 'hi'>>;
type _t2 = Expect<Equal<TrimLeft<'\n\t hi '>, 'hi '>>;
type _t3 = Expect<Equal<TrimLeft<''>, ''>>;
type _t4 = Expect<Equal<TrimLeft<'hi'>, 'hi'>>;
type _t5 = Expect<Equal<TrimLeft<'   '>, ''>>;

function _typeTests() {
  const ok: Split<'a,b', ','> = ['a', 'b'];
  use(ok);

  // @ts-expect-error — Split returns the pieces, not the original string
  const wrong: Split<'a,b', ','> = 'a,b';
  use(wrong);

  // @ts-expect-error — TrimLeft keeps the trailing space: 'hi ', not 'hi'
  const kept: TrimLeft<'  hi '> = 'hi';
  use(kept);
}
use(_typeTests);
