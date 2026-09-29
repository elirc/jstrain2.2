// ─────────────────────────────────────────────────────────────────────────
//  15 · index signatures and Record                         ★★☆ core
//  concepts: index signatures · Record · keyof
//  run: node ../run.js exercises/15-index-signatures.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Two ways to type "an object used as a dictionary", for two different
//  situations:
//
//      { [word: string]: number }            open — any key, one value type
//      Record<'darkMode' | 'beta', boolean>  closed — exactly these keys
//
//  `Record<K, V>` with a literal-union K is the one you want whenever the
//  key set is known: it demands every key and rejects the rest.
//
//      countWords(['the', 'cat', 'the'])   → { the: 2, cat: 1 }
//      totalCount({ the: 2, cat: 1 })      → 3
//      enabledFlags({ darkMode: true, beta: false })  → ['darkMode']
//
//  enabledFlags returns the keys whose flag is on, sorted.
//
//  hint: an index signature answers EVERY key — `counts.banana` is typed
//  `number` even when the word never appeared. That hole is the price of
//  an open dictionary; `??` at the read site is the usual defence

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type Counts = TODO;
export type Flags = TODO;

export function countWords(words: TODO): Counts {
  throw new Error('TODO');
}

export function totalCount(counts: Counts): number {
  throw new Error('TODO');
}

export function enabledFlags(flags: Flags): string[] {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('countWords tallies repeats', () => {
  eq(countWords(['the', 'cat', 'the']), { the: 2, cat: 1 });
});

test('countWords of nothing is an empty object', () => {
  eq(countWords([]), {});
});

test('totalCount adds every value', () => {
  eq(totalCount({ the: 2, cat: 1 }), 3);
});

test('enabledFlags lists only the flags that are on', () => {
  eq(enabledFlags({ darkMode: true, beta: false }), ['darkMode']);
  eq(enabledFlags({ darkMode: true, beta: true }), ['beta', 'darkMode']);
  eq(enabledFlags({ darkMode: false, beta: false }), []);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _1 = Expect<Equal<Counts, Record<string, number>>>;
type _2 = Expect<Equal<Counts[string], number>>;
type _3 = Expect<Equal<Flags, { darkMode: boolean; beta: boolean }>>;
type _4 = Expect<Equal<keyof Flags, 'darkMode' | 'beta'>>;

function _typeTests() {
  const counts: Counts = { the: 2 };
  // an index signature answers for keys that were never there
  const never: number = counts.banana;
  use(never);

  // @ts-expect-error — the values are numbers
  counts.the = 'two';

  const flags: Flags = { darkMode: true, beta: false };
  use(flags);

  // @ts-expect-error — Flags has exactly two keys
  flags.nope = true;

  // @ts-expect-error — and Record demands both of them
  const partial: Flags = { darkMode: true };
  use(partial);
}
use(_typeTests);
