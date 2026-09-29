// ─────────────────────────────────────────────────────────────────────────
//  05 · MyPartial and MyRequired                            ★★☆ core
//  concepts: mapped types · the ? and -? modifiers
//  run: node ../run.js exercises/05-my-partial-required.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Time to build the builtins. A mapped type is a for-loop over keys:
//
//      type Loop<T> = { [K in keyof T]: T[K] };   // an exact copy
//
//  Add a modifier inside the loop and you get the utility types. `?` makes
//  every key optional; `-?` takes the question mark off — and, less
//  obviously, strips `undefined` out of the value type too.
//
//      MyPartial<{ a: string }>    →  { a?: string }
//      MyRequired<{ a?: string }>  →  { a: string }
//
//  Then implement the two tiny functions that consume those shapes.
//
//  hint: `keyof T` is the union of T's keys; `T[K]` is an indexed access

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type MyPartial<T> = TODO;
export type MyRequired<T> = TODO;

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
  throw new Error('TODO');
}

export function wordCount(draft: MyRequired<DraftPatch>): number {
  throw new Error('TODO');
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
