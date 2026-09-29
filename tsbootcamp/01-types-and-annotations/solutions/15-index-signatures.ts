// ─────────────────────────────────────────────────────────────────────────
//  15 · index signatures and Record — SOLUTION              ★★☆ core
//  run: node ../run.js solutions/15-index-signatures.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `{ [word: string]: number }` and `Record<string, number>`
//  are the same type — Record is a mapped type that expands to exactly
//  that index signature, and the type test proves it. Pick whichever
//  reads better; Record wins when the key type is a union.
//
//  The two shapes solve different problems. `Counts` is OPEN: any string
//  is a key, so `counts[word]` type-checks for words you have never seen
//  — and returns `undefined` at runtime while claiming to be a number.
//  That is why `counts[word] ?? 0` is in the implementation, and it is
//  the single biggest gotcha of dictionary types. (The compiler flag
//  `noUncheckedIndexedAccess` closes the hole by typing every read as
//  `T | undefined`; this bootcamp leaves it off so you meet the default
//  behaviour you will find in most codebases.)
//
//  `Flags` is CLOSED: `Record<'darkMode' | 'beta', boolean>` requires
//  both keys and rejects a third, so `keyof Flags` is a real union you
//  can iterate and switch over. Whenever you know the key set, say so —
//  `Record<string, boolean>` there would give up every guarantee.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type Counts = { [word: string]: number };
export type Flags = Record<'darkMode' | 'beta', boolean>;

export function countWords(words: readonly string[]): Counts {
  const counts: Counts = {};
  for (const word of words) counts[word] = (counts[word] ?? 0) + 1;
  return counts;
}

export function totalCount(counts: Counts): number {
  return Object.values(counts).reduce((sum, count) => sum + count, 0);
}

export function enabledFlags(flags: Flags): string[] {
  return Object.entries(flags)
    .filter(([, on]) => on)
    .map(([key]) => key)
    .sort();
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
