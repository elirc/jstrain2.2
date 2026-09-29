// ─────────────────────────────────────────────────────────────────────────
//  04 · move                                              ★☆☆ warm-up
//  concepts: `in` narrowing · structural unions
//  run: node ../run.js exercises/04-in-operator.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  A Bird and a Fish share nothing but a name. There is no `kind` field to
//  switch on — so you narrow by asking which MEMBER the object has:
//  `'fly' in pet` tells the compiler it is a Bird.
//
//      move(robin)     → 'robin: flap flap'
//      move(cod)       → 'cod: swish'
//      habitat(robin)  → 'air'
//      habitat(cod)    → 'water'
//
//  Use a different member for each function — any member unique to one
//  side of the union works.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

function probe<T>(value: T): T {
  return value;
}

export interface Bird {
  name: string;
  wingspanCm: number;
  fly(): string;
}

export interface Fish {
  name: string;
  depthM: number;
  swim(): string;
}

export type Pet = Bird | Fish;

const robin: Bird = { name: 'robin', wingspanCm: 25, fly: () => 'flap flap' };
const cod: Fish = { name: 'cod', depthM: 40, swim: () => 'swish' };

export function move(pet: TODO): string {
  throw new Error('TODO');
}

export function habitat(pet: TODO): string {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('a bird flies', () => {
  eq(move(robin), 'robin: flap flap');
});

test('a fish swims', () => {
  eq(move(cod), 'cod: swish');
});

test('habitat reads a different member than move does', () => {
  eq(habitat(robin), 'air');
  eq(habitat(cod), 'water');
});

test('works on any object with the right shape', () => {
  const gull: Bird = { name: 'gull', wingspanCm: 90, fly: () => 'soar' };
  eq(move(gull), 'gull: soar');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<Equal<Parameters<typeof move>[0], Pet>>;

function _typeTests() {
  const pet = robin as Pet;

  if ('fly' in pet) {
    const p = probe(pet);
    type _bird = Expect<Equal<typeof p, Bird>>;
    use(p);
  } else {
    const p = probe(pet);
    type _fish = Expect<Equal<typeof p, Fish>>;
    use(p);
  }

  // @ts-expect-error — before narrowing, only the shared members exist
  pet.depthM;

  // @ts-expect-error — move accepts a Bird or a Fish, not any old object
  move({ name: 'rock' });
}
use(_typeTests);
