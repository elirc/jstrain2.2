// ─────────────────────────────────────────────────────────────────────────
//  11 · StringToUnion & LengthOfString                      ★★★ stretch
//  concepts: char-by-char recursion · the accumulator parameter
//  run: node ../run.js exercises/11-string-to-union.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Two placeholders in a row — `${infer C}${infer Rest}` — split off
//  exactly ONE character. Everything you can do to a string in type land
//  starts there.
//
//      StringToUnion<'abc'>     → 'a' | 'b' | 'c'
//      StringToUnion<'aa'>      → 'a'          (a union has no duplicates)
//      StringToUnion<''>        → never
//      LengthOfString<'hello'>  → 5
//      LengthOfString<''>       → 0
//
//  There is no arithmetic in type land, so LengthOfString counts with an
//  ACCUMULATOR: push one element onto the tuple Acc per character and
//  read Acc['length'] at the end. The extra parameter is already in the
//  signature — you write the recursion.
//
//  hint: `${string}${infer R}` when you want the rest but not the char

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal, type IsNever } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type StringToUnion<S extends string> = TODO;
export type LengthOfString<S extends string, Acc extends unknown[] = []> = TODO;

// ─────────────────────────── runtime tests ───────────────────────────────

const letter: StringToUnion<'abc'> = 'b';
const len: LengthOfString<'hello'> = 5;

test('the character types hold real characters', () => {
  eq(letter, 'b');
  eq(len, 5);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _u1 = Expect<Equal<StringToUnion<'abc'>, 'a' | 'b' | 'c'>>;
type _u2 = Expect<Equal<StringToUnion<'hi'>, 'h' | 'i'>>;
// duplicates collapse: a union is a set
type _u3 = Expect<Equal<StringToUnion<'aa'>, 'a'>>;
// no characters, no members — the empty string is the base case
type _u4 = Expect<IsNever<StringToUnion<''>>>;
type _u5 = Expect<Equal<StringToUnion<'a b'>, 'a' | ' ' | 'b'>>;

type _l1 = Expect<Equal<LengthOfString<'hello'>, 5>>;
type _l2 = Expect<Equal<LengthOfString<''>, 0>>;
type _l3 = Expect<Equal<LengthOfString<'a'>, 1>>;
type _l4 = Expect<Equal<LengthOfString<'  '>, 2>>;

function _typeTests() {
  const c: StringToUnion<'abc'> = 'c';
  use(c);

  // @ts-expect-error — 'd' is not one of the characters of 'abc'
  const bad: StringToUnion<'abc'> = 'd';
  use(bad);

  // @ts-expect-error — the length is the literal 5, not any number
  const wrong: LengthOfString<'hello'> = 4;
  use(wrong);
}
use(_typeTests);
