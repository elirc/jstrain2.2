// ─────────────────────────────────────────────────────────────────────────
//  04 · the hole in the narrowing                          ★★☆ core
//  concepts: unions · shared method names · calls that skip narrowing
//  run: node ../run.js exercises/04-narrowing-hole.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  A tag list arrives either as an array or as one comma-separated
//  string, because two different endpoints send it two different ways.
//  `toTags` normalises it; `hasTag` answers whether a WHOLE tag is in
//  there — never half of one, never a run of characters that happens to
//  straddle the comma.
//
//      toTags('alpha, beta')             → ['alpha', 'beta']
//      toTags([' alpha', 'beta '])       → ['alpha', 'beta']
//      hasTag('alpha,beta', 'beta')      → true
//      hasTag('alpha,beta', 'alph')      → false   ← half a tag is no tag
//      hasTag('alpha,beta', 'ha,be')     → false
//      hasTag([' beta'], 'beta')         → true
//
//  tsc signs this off without a word. Three tests fail. Find the bug,
//  make the smallest fix, do not rewrite the file.
//
//  hint: put a `console.log(typeof tags)` in the failing case and ask
//  which member of the union answered the call — and with what meaning.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type TagList = string | string[];

export function toTags(tags: TagList): string[] {
  const parts = typeof tags === 'string' ? tags.split(',') : tags;
  return parts.map((tag) => tag.trim()).filter((tag) => tag.length > 0);
}

export function hasTag(tags: TagList, tag: string): boolean {
  return tags.includes(tag);
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
