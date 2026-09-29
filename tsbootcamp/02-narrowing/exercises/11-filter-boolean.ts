// ─────────────────────────────────────────────────────────────────────────
//  11 · compact                                           ★★★ stretch
//  concepts: NonNullable · guards in filter · the filter(Boolean) trap
//  run: node ../run.js exercises/11-filter-boolean.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  `values.filter(Boolean)` is the reflex, and it is wrong twice over.
//  At runtime it also throws away `0`, `''`, `NaN` and `false`. At the
//  type level it does nothing at all: `(string | null)[]` goes in and
//  `(string | null)[]` comes back out, because `Boolean` is typed
//  `(value?: any) => boolean`, not as a guard.
//
//      compact(['a', null, 'b', undefined])  → ['a', 'b']
//      compact([0, null, 1])                 → [0, 1]      keeps the 0
//      compact([''])                         → ['']        keeps the ''
//      joinPresent(['a', null, 'b'], '-')    → 'a-b'
//
//  Build the guard once and reuse it everywhere. `NonNullable<T>` is the
//  built-in that strips `null` and `undefined` out of a type.
//
//  hint: `isPresent` needs a type parameter so the narrowed type follows
//  whatever went in.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

function probe<T>(value: T): T {
  return value;
}

export function isPresent<T>(value: T): TODO {
  throw new Error('TODO');
}

export function compact<T>(values: T[]): TODO {
  throw new Error('TODO');
}

export function joinPresent(
  values: (string | null | undefined)[],
  sep: string
): string {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('drops null and undefined', () => {
  eq(compact(['a', null, 'b', undefined]), ['a', 'b']);
});

test('keeps zero — the bug filter(Boolean) ships', () => {
  eq(compact([0, null, 1]), [0, 1]);
});

test('keeps the empty string and false', () => {
  eq(compact(['', null]), ['']);
  eq(compact([false, undefined]), [false]);
});

test('isPresent is about null-ness, not truthiness', () => {
  ok(isPresent(0), '0 is present');
  ok(isPresent(''), 'the empty string is present');
  ok(!isPresent(null), 'null is absent');
  ok(!isPresent(undefined), 'undefined is absent');
});

test('an array with nothing to drop comes back equal', () => {
  eq(compact([1, 2, 3]), [1, 2, 3]);
});

test('joinPresent skips the holes', () => {
  eq(joinPresent(['a', null, 'b'], '-'), 'a-b');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<Equal<ReturnType<typeof compact<string | null>>, string[]>>;

function _typeTests() {
  const raw: (string | null)[] = ['a', null];

  const clean = raw.filter(isPresent);
  type _clean = Expect<Equal<typeof clean, string[]>>;
  use(clean);

  // @ts-expect-error — filter(Boolean) does NOT remove null from the type
  const stillNullable: string[] = raw.filter(Boolean);
  use(stillNullable);

  const mixed = compact([1, null, undefined, 2]);
  type _mixed = Expect<Equal<typeof mixed, number[]>>;
  use(mixed);

  const maybe = null as string | null;

  if (isPresent(maybe)) {
    const p = probe(maybe);
    type _narrowed = Expect<Equal<typeof p, string>>;
    use(p);
  }
}
use(_typeTests);
