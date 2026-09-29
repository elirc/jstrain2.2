// ─────────────────────────────────────────────────────────────────────────
//  04 · move — SOLUTION                                   ★☆☆ warm-up
//  run: node ../run.js solutions/04-in-operator.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `'fly' in pet` is an ordinary JS expression, and the
//  compiler treats it as a narrowing question: which members of the union
//  could have a `fly` property? Only Bird — so the true branch is a Bird
//  and the false branch is a Fish. `'wingspanCm' in pet` narrows exactly
//  the same way, which is why `habitat` can pick a different member.
//
//  Before any check, `pet` only exposes what BOTH members have (`name`).
//  That is not the compiler being difficult; a union really is "one of
//  these", so only the shared surface is safe.
//
//  Note the limit: `in` asks about a property NAME, not a value. If both
//  variants had `fly`, it would narrow nothing — that is when you reach
//  for a discriminant (exercise 06).

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

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

export function move(pet: Pet): string {
  if ('fly' in pet) return `${pet.name}: ${pet.fly()}`;
  return `${pet.name}: ${pet.swim()}`;
}

export function habitat(pet: Pet): string {
  return 'wingspanCm' in pet ? 'air' : 'water';
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
