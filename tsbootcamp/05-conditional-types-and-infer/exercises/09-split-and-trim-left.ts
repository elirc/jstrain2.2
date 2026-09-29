// ─────────────────────────────────────────────────────────────────────────
//  09 · Split & TrimLeft                                    ★★★ stretch
//  concepts: template literal inference · recursion over strings
//  run: node ../run.js exercises/09-split-and-trim-left.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  A template literal type is a pattern with holes: matching
//  `${infer Head}${D}${infer Tail}` against 'a,b,c' with D = ',' binds
//  Head = 'a' and Tail = 'b,c' — the FIRST delimiter wins. Recurse on
//  Tail and you have String.prototype.split, at compile time.
//
//      Split<'a,b,c', ','>     → ['a', 'b', 'c']
//      Split<'a', ','>         → ['a']
//      Split<'', ','>          → ['']
//      Split<'a,,b', ','>      → ['a', '', 'b']
//      TrimLeft<'  hi'>        → 'hi'
//      TrimLeft<'\n\t hi '>    → 'hi '     (only the LEFT side)
//
//  hint: Split's base case is [S], not [] — "no delimiter" still has one
//        piece; TrimLeft's whitespace pattern can be a union

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

// provided — the characters TrimLeft should eat
type Whitespace = ' ' | '\n' | '\t';

type TODO = any; // replace every TODO below with real types

export type Split<S extends string, D extends string> = TODO;
export type TrimLeft<S extends string> = TODO;

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
