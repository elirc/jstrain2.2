// ─────────────────────────────────────────────────────────────────────────
//  10 · default type parameters                           ★★☆ core
//  concepts: type parameter defaults · when inference wins
//  run: node ../run.js exercises/10-default-type-params.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  `<Meta = Record<string, unknown>>` gives a type parameter a fallback,
//  so `LogEntry` on its own means `LogEntry<Record<string, unknown>>`.
//  The rule for when the default kicks in is short:
//
//      LogEntry                       → the default is used
//      LogEntry<{ userId: number }>   → you named it, you win
//      entry('saved', { userId: 7 })  → INFERENCE wins over the default
//      emptyBag()                     → nothing to infer from → default
//      emptyBag<number>()             → explicit wins
//
//  Build the interface, then three functions: `entry` (infers Meta),
//  `blankEntry` (returns a plain `LogEntry`, letting the default apply)
//  and `emptyBag` (nothing to infer from — the default is all it has).
//
//  hint: a default is not a constraint. `<Meta = Record<string,
//  unknown>>` still accepts any Meta; write `<Meta extends object =
//  Record<string, unknown>>` when you want both

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export interface LogEntry<Meta = TODO> {
  message: string;
  meta: TODO;
}

export function entry(message: string, meta: TODO): TODO {
  throw new Error('TODO');
}

export function blankEntry(message: string): TODO {
  throw new Error('TODO');
}

export function emptyBag(): TODO {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('entry keeps the message and the meta it was given', () => {
  eq(entry('saved', { userId: 7 }), { message: 'saved', meta: { userId: 7 } });
});

test('entry works with any meta shape', () => {
  eq(entry('ping', { at: 'noon', retries: 2 }), {
    message: 'ping',
    meta: { at: 'noon', retries: 2 },
  });
});

test('blankEntry supplies an empty meta bag', () => {
  eq(blankEntry('boot'), { message: 'boot', meta: {} });
});

test('emptyBag starts empty', () => {
  eq(emptyBag(), {});
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<Equal<LogEntry, LogEntry<Record<string, unknown>>>>;
type _r2 = Expect<Equal<LogEntry<{ id: number }>['meta'], { id: number }>>;
type _r3 = Expect<Equal<ReturnType<typeof emptyBag<number>>, Record<string, number>>>;

function _typeTests() {
  // inference beats the default: Meta comes from the argument
  const inferred = entry('saved', { userId: 7 });
  type _i = Expect<Equal<typeof inferred, LogEntry<{ userId: number }>>>;
  use(inferred);

  const blank = blankEntry('boot');
  type _b = Expect<Equal<typeof blank, LogEntry<Record<string, unknown>>>>;
  use(blank);

  // nothing to infer from, so the default is what you get
  const bag = emptyBag();
  type _g = Expect<Equal<typeof bag, Record<string, string>>>;
  use(bag);

  const numbers = emptyBag<number>();
  type _n = Expect<Equal<typeof numbers, Record<string, number>>>;
  use(numbers);

  // @ts-expect-error — the default meta is a loose bag; it is not { id: number }
  const wrong: LogEntry<{ id: number }> = blankEntry('boot');
  use(wrong);
}
use(_typeTests);
