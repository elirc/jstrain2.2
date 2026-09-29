// ─────────────────────────────────────────────────────────────────────────
//  10 · default type parameters — SOLUTION                ★★☆ core
//  run: node ../run.js solutions/10-default-type-params.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a default is what a type parameter falls back to when
//  nobody supplies it — by hand or by inference. The order is: explicit
//  type argument, then inference from the arguments, then the default,
//  then (if there is none) the constraint, then `unknown`.
//
//  `entry<Meta = Record<string, unknown>>(message, meta: Meta)` proves the
//  middle step: the default never fires there, because the argument
//  always gives Meta something better. `emptyBag<V = string>()` has no
//  arguments at all, so the default is the only source — that is the
//  version of exercise 03's `emptyArrayOf` with a friendlier fallback
//  than `unknown`.
//
//  `blankEntry(message): LogEntry` shows the type-side benefit: writing
//  `LogEntry` bare stays legal because Meta has a default. Drop the
//  default and every mention of the type has to spell out its argument.
//
//  Careful: a default is not a constraint. `<Meta = Record<string,
//  unknown>>` still lets someone write `LogEntry<number>`; add `extends
//  object` when the fallback is also meant to be the rule.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface LogEntry<Meta = Record<string, unknown>> {
  message: string;
  meta: Meta;
}

export function entry<Meta = Record<string, unknown>>(
  message: string,
  meta: Meta
): LogEntry<Meta> {
  return { message, meta };
}

export function blankEntry(message: string): LogEntry {
  return { message, meta: {} };
}

export function emptyBag<V = string>(): Record<string, V> {
  return {};
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
