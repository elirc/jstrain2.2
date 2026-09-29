// ─────────────────────────────────────────────────────────────────────────
//  05 · MyPartial and MyRequired — SOLUTION                 ★★☆ core
//  run: node ../run.js solutions/05-my-partial-required.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: both are one line. `{ [K in keyof T]?: T[K] }` iterates the
//  key union and rebuilds the object with a `?` bolted on; `-?` is the
//  subtraction form of the same modifier. There is also `+?`, which is
//  what a bare `?` means — you will see `+readonly` in library code for
//  the same reason.
//
//  Two facts worth carrying:
//
//  1. These are HOMOMORPHIC mapped types — the loop source is literally
//     `keyof T` — so `readonly` (and, for `?`, the existing optionality)
//     is copied through. Test _t3 proves it. If you had written
//     `{ [K in keyof T]?: T[K] }` as `Record<keyof T, T[keyof T]>` instead
//     you would lose both the modifiers and the per-key value types.
//  2. `-?` also removes `undefined` from the property type. That is why
//     `wordCount` can call `draft.body.trim()` with no `?.` — after
//     MyRequired the body is `string`, not `string | undefined`. (_t5
//     shows that an explicit `| null` is NOT removed; only undefined is.)

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type MyPartial<T> = { [K in keyof T]?: T[K] };
export type MyRequired<T> = { [K in keyof T]-?: T[K] };

export interface Draft {
  title: string;
  body: string;
  tags: string[];
}

export interface DraftPatch {
  title?: string;
  body?: string;
  tags?: string[];
}

export function summarize(draft: MyPartial<Draft>): string {
  const title = draft.title ?? 'Untitled';
  const tags = draft.tags ?? [];
  return `${title} · ${tags.length} tags`;
}

export function wordCount(draft: MyRequired<DraftPatch>): number {
  return draft.body.split(/\s+/).filter((word) => word.length > 0).length;
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('summarizes an empty draft', () => {
  eq(summarize({}), 'Untitled · 0 tags');
});

test('summarizes a partly filled draft', () => {
  eq(summarize({ title: 'Hi', tags: ['a', 'b'] }), 'Hi · 2 tags');
});

test('counts the words of a required draft', () => {
  eq(wordCount({ title: 't', body: 'one two three', tags: [] }), 3);
});

test('an empty body counts as zero words', () => {
  eq(wordCount({ title: 't', body: '   ', tags: [] }), 0);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _t1 = Expect<
  Equal<MyPartial<{ a: string; b?: number }>, { a?: string; b?: number }>
>;
type _t2 = Expect<
  Equal<MyRequired<{ a?: string; b: number }>, { a: string; b: number }>
>;
// homomorphic: the loop runs over `keyof T`, so readonly survives it
type _t3 = Expect<
  Equal<MyPartial<{ readonly a: string }>, { readonly a?: string }>
>;
type _t4 = Expect<
  Equal<MyRequired<{ readonly a?: string }>, { readonly a: string }>
>;
// -? removes `undefined` from the value type, not just the question mark
type _t5 = Expect<
  Equal<MyRequired<{ a?: string | null }>, { a: string | null }>
>;
type _t6 = Expect<Equal<MyPartial<Draft>, Partial<Draft>>>;
type _t7 = Expect<Equal<MyRequired<DraftPatch>, Required<DraftPatch>>>;

function _typeTests() {
  summarize({});
  summarize({ title: 'Hi' });
  wordCount({ title: 't', body: 'b', tags: [] });

  // @ts-expect-error — every key of a required draft must be present
  const gap: MyRequired<DraftPatch> = { title: 'x' };
  use(gap);

  // @ts-expect-error — optional does not mean untyped
  summarize({ title: 42 });

  // @ts-expect-error — the body is not optional once -? has run
  wordCount({ title: 't', tags: [] });
}
use(_typeTests);
