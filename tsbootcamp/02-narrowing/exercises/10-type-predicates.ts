// ─────────────────────────────────────────────────────────────────────────
//  10 · type predicates                                      ★★☆ core
//  concepts: `x is T` · user-defined guards · guards in filter
//  run: node ../run.js exercises/10-type-predicates.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  `typeof`, `in` and `instanceof` are the guards TypeScript ships with.
//  A type predicate lets you write your own: declare the return type as
//  `pet is Fish` instead of `boolean` and every `if (isFish(pet))` in the
//  codebase narrows.
//
//      isFish(nemo)              → true, and nemo is a Fish inside the if
//      pets.filter(isFish)       → Fish[], not Pet[]
//      isNonEmpty([])            → false
//      isNonEmpty([1, 2])        → true, and the array is [number, ...]
//      headOrNull([])            → null
//      headOrNull([1, 2])        → 1
//
//  hint: a predicate's declared type must be assignable to the parameter
//  type — `[T, ...T[]]` is a legal narrowing of `T[]`.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

function probe<T>(value: T): T {
  return value;
}

export interface Fish {
  name: string;
  swim(): string;
}

export interface Bird {
  name: string;
  fly(): string;
}

export type Pet = Fish | Bird;

const nemo: Fish = { name: 'nemo', swim: () => 'swish' };
const dory: Fish = { name: 'dory', swim: () => 'swish' };
const tweety: Bird = { name: 'tweety', fly: () => 'flap' };
const pets: Pet[] = [nemo, tweety, dory];

export function isFish(pet: TODO): TODO {
  throw new Error('TODO');
}

export function isNonEmpty<T>(values: T[]): TODO {
  throw new Error('TODO');
}

export function fishNames(pets: Pet[]): string[] {
  throw new Error('TODO');
}

export function headOrNull<T>(values: T[]): T | null {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('isFish tells the two apart', () => {
  ok(isFish(nemo), 'nemo is a fish');
  ok(!isFish(tweety), 'tweety is not a fish');
});

test('filtering with a guard keeps only the fish', () => {
  eq(fishNames(pets), ['nemo', 'dory']);
});

test('isNonEmpty is false for an empty array', () => {
  eq(isNonEmpty([]), false);
});

test('isNonEmpty is true as soon as there is one element', () => {
  eq(isNonEmpty([0]), true);
});

test('headOrNull returns null instead of undefined', () => {
  eq(headOrNull([]), null);
});

test('headOrNull returns the first element when there is one', () => {
  eq(headOrNull(['a', 'b']), 'a');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<Equal<Parameters<typeof isFish>[0], Pet>>;

function _typeTests() {
  const onlyFish = pets.filter(isFish);
  type _filtered = Expect<Equal<typeof onlyFish, Fish[]>>;
  use(onlyFish);

  const pet = pets[0];

  if (isFish(pet)) {
    const p = probe(pet);
    type _fish = Expect<Equal<typeof p, Fish>>;
    use(p, p.swim());
  } else {
    const p = probe(pet);
    type _bird = Expect<Equal<typeof p, Bird>>;
    use(p, p.fly());
  }

  const nums: number[] = [1, 2];

  if (isNonEmpty(nums)) {
    type _tuple = Expect<Equal<typeof nums, [number, ...number[]]>>;
    use(nums);
  }

  // @ts-expect-error — isFish takes a Pet, not any old object
  isFish({ name: 'rock' });
}
use(_typeTests);
