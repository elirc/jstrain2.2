// ─────────────────────────────────────────────────────────────────────────
//  01 · identity                                          ★☆☆ warm-up
//  concepts: type parameters · inference
//  run: node ../run.js exercises/01-identity.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  A generic is a function over types: it takes a type in and gives a
//  type back. Start with the smallest one there is. `identity` hands back
//  exactly what it was given — and the type system has to agree.
//
//      identity(5)        → 5        (typed number)
//      identity('ready')  → 'ready'  (typed 'ready')
//      same(2, 2)         → true
//      same('a', 'b')     → false
//
//  `same` compares two values with `===`, and both arguments must be the
//  same type — one type parameter used twice buys you that for free.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export function identity(value: TODO): TODO {
  throw new Error('TODO');
}

export function same(a: TODO, b: TODO): boolean {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('gives back the number it was given', () => {
  eq(identity(5), 5);
});

test('gives back the same object, not a copy', () => {
  const config = { retries: 3 };
  ok(identity(config) === config);
});

test('same() is true for two equal primitives', () => {
  eq(same('a', 'a'), true);
});

test('same() compares by reference, so twins are not the same', () => {
  eq(same({ id: 1 }, { id: 1 }), false);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<Equal<ReturnType<typeof identity<string>>, string>>;
type _r2 = Expect<Equal<ReturnType<typeof identity<number[]>>, number[]>>;

function _typeTests() {
  const n: number = identity(5);
  const s: string = identity('hi');
  use(n, s);

  // nobody writes <> at the call site — the argument decides T
  const kept = identity('ready');
  type _k = Expect<Equal<typeof kept, 'ready'>>;
  use(kept);

  // @ts-expect-error — T was pinned to number by hand; a string cannot fit
  identity<number>('nope');

  // @ts-expect-error — both arguments feed the SAME type parameter
  same(1, 'one');

  // @ts-expect-error — same() answers a question, it does not return a value
  const wrong: number = same(1, 2);
  use(wrong);
}
use(_typeTests);
