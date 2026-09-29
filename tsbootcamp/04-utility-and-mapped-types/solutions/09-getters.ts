// ─────────────────────────────────────────────────────────────────────────
//  09 · Getters — SOLUTION                                  ★★★ stretch
//  run: node ../run.js solutions/09-getters.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//
//      type Getters<T> = {
//        [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
//      };
//
//  The `as` clause rewrites the key while the loop still knows which key
//  it came from — that is why the value can stay `() => T[K]`. Drop the
//  `as` and you cannot rename; rename outside the loop and you lose the
//  link between key and value type.
//
//  `string & K` is the bit that bites. `keyof T` is `string | number |
//  symbol`, and a template literal type cannot interpolate a symbol, so
//  `Capitalize<K>` alone is a compile error. `string & K` narrows each key
//  to its string part (a symbol key intersects to `never`, so it simply
//  drops out of the result — which is usually what you want).
//
//  Runtime: capitalise with `charAt(0).toUpperCase() + slice(1)`, and
//  capture `key` in the arrow so the getter reads the LIVE object rather
//  than a snapshot (test four). One cast at the return — tsc cannot prove
//  a string built in a loop matches the remapped key type.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

export interface Person {
  name: string;
  age: number;
}

export function makeGetters<T extends object>(obj: T): Getters<T> {
  const out: Record<string, () => unknown> = {};
  for (const key of Object.keys(obj) as Array<keyof T & string>) {
    out[`get${key.charAt(0).toUpperCase()}${key.slice(1)}`] = () => obj[key];
  }
  return out as Getters<T>;
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('each property gets a get-prefixed reader', () => {
  const g = makeGetters({ name: 'Ada', age: 36 });
  eq(g.getName(), 'Ada');
  eq(g.getAge(), 36);
});

test('the result carries only the generated keys', () => {
  const g = makeGetters({ name: 'Ada', age: 36 });
  eq(Object.keys(g).sort(), ['getAge', 'getName']);
});

test('no properties, no getters', () => {
  eq(Object.keys(makeGetters({})), []);
});

test('the getters read through to the source object', () => {
  const person = { name: 'Ada', age: 36 };
  const g = makeGetters(person);
  person.name = 'Grace';
  eq(g.getName(), 'Grace');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _t1 = Expect<
  Equal<Getters<Person>, { getName: () => string; getAge: () => number }>
>;
type _t2 = Expect<
  Equal<keyof Getters<{ id: string; isActive: boolean }>, 'getId' | 'getIsActive'>
>;
type _t3 = Expect<Equal<Getters<{}>, {}>>;
// Capitalize touches the FIRST character only — the rest is untouched
type _t4 = Expect<Equal<keyof Getters<{ aB: number }>, 'getAB'>>;
// the value type follows the key it came from
type _t5 = Expect<
  Equal<Getters<{ tags: string[] }>['getTags'], () => string[]>
>;

function _typeTests() {
  const g = makeGetters({ name: 'Ada', age: 36 });
  const name: string = g.getName();
  use(name);

  // @ts-expect-error — the original keys are replaced, not kept alongside
  g.name;

  // @ts-expect-error — capitalisation is part of the key
  g.getname();

  // @ts-expect-error — a getter takes no arguments
  g.getAge(1);
}
use(_typeTests);
