// ─────────────────────────────────────────────────────────────────────────
//  04 · the hole in the narrowing — SOLUTION               ★★☆ core
//  run: node ../run.js solutions/04-narrowing-hole.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//
//  BUG CLASS — a union that was never narrowed, because both members
//  happened to answer the same method name with different meanings.
//
//  THE TELL — `hasTag` is the only function in the file with no `typeof`
//  in it, and the failures split by input shape: strings match too much,
//  arrays match too little. Different wrongness per member is the
//  signature of one code path serving two types.
//
//  `tags.includes(tag)` is `String.prototype.includes` for one member —
//  a SUBSTRING test, which says yes to 'alph' and to 'ha,be' — and
//  `Array.prototype.includes` for the other — an exact-element test,
//  which says no to 'beta' when the element is ' beta'. Neither is the
//  function's contract.
//
//  WHY TSC COULD NOT CATCH IT — since TS 3.3 a call on a union type
//  resolves when every member has a compatible signature. Both
//  `includes` methods take `(string, number?)` and return `boolean`, so
//  the call type-checks and hands back `boolean` without narrowing
//  anything. The types line up perfectly; only the SEMANTICS differ, and
//  the compiler has no access to those.
//
//  Hover `tags` at that call and it is still `string | string[]` — the
//  diagnostic move for this whole class. If the receiver of a call is
//  still a union, no branch was ever taken, and you are relying on two
//  implementations agreeing about meaning.
//
//  THE FIX — normalise first, then ask: `toTags(tags).includes(tag)`.
//  One call site, one type, one meaning. The narrowing lives in `toTags`
//  where it was already correct, which is the general shape of the cure:
//  collapse the union at the edge and let everything inside see one type.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type TagList = string | string[];

export function toTags(tags: TagList): string[] {
  const parts = typeof tags === 'string' ? tags.split(',') : tags;
  return parts.map((tag) => tag.trim()).filter((tag) => tag.length > 0);
}

export function hasTag(tags: TagList, tag: string): boolean {
  return toTags(tags).includes(tag);
}

export function tagCount(tags: TagList): number {
  return toTags(tags).length;
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('a comma string splits and trims', () => {
  eq(toTags('alpha, beta ,gamma'), ['alpha', 'beta', 'gamma']);
  eq(toTags(''), []);
});

test('an array is trimmed too, and empties fall out', () => {
  eq(toTags([' alpha', 'beta ', '  ']), ['alpha', 'beta']);
  eq(tagCount([' alpha', 'beta ', '  ']), 2);
});

test('a whole tag is found in an array', () => {
  ok(hasTag(['alpha', 'beta'], 'beta'));
  ok(!hasTag(['alpha', 'beta'], 'gamma'));
});

test('a whole tag is found in a comma string', () => {
  ok(hasTag('alpha,beta', 'beta'));
  ok(!hasTag('alpha,beta', 'gamma'));
});

test('half a tag is not a tag', () => {
  ok(!hasTag('alpha,beta', 'alph'));
  ok(!hasTag('alpha,beta', 'eta'));
});

test('a match that straddles the comma is not a tag', () => {
  ok(!hasTag('alpha,beta', 'ha,be'));
  ok(!hasTag('alpha,beta', 'alpha,beta'));
});

test('padding around a tag never hides it', () => {
  ok(hasTag('alpha, beta', 'beta'));
  ok(hasTag([' beta'], 'beta'));
});

// ──────────────────────────── type tests ─────────────────────────────────
//
//  These already pass — in the broken file and in the fixed one. That is
//  the whole point of the module: the type layer is satisfied either way.

type _t1 = Expect<Equal<ReturnType<typeof hasTag>, boolean>>;
type _t2 = Expect<Equal<ReturnType<typeof toTags>, string[]>>;

function _typeTests() {
  const list: TagList = 'a,b';
  const n: number = tagCount(list);
  use(n);

  // @ts-expect-error — a number is not a tag list
  hasTag(42, 'a');

  // @ts-expect-error — the tag being looked for is a single string
  hasTag(['a', 'b'], ['a']);
}
use(_typeTests);
