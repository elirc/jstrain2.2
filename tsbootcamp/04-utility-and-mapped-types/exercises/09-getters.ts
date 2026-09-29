// ─────────────────────────────────────────────────────────────────────────
//  09 · Getters                                             ★★★ stretch
//  concepts: key remapping with `as` · Capitalize · string & K
//  run: node ../run.js exercises/09-getters.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  A mapped type can rename the key mid-loop with an `as` clause:
//
//      { [K in keyof T as NewKey]: NewValue }
//
//  Build Getters<T>: every property becomes a zero-argument function named
//  after it, capitalised and prefixed.
//
//      Getters<{ name: string; age: number }>
//        →  { getName: () => string; getAge: () => number }
//
//  Then makeGetters builds that object at runtime, so `.getName()` really
//  returns the name.
//
//  Two intrinsic string types exist for this: Capitalize<S> and its
//  friends Uncapitalize / Uppercase / Lowercase.
//
//  hint: `keyof T` can include symbols, and you cannot interpolate a
//  symbol into a template literal — `string & K` filters it down first

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type Getters<T> = TODO;

export interface Person {
  name: string;
  age: number;
}

export function makeGetters<T extends object>(obj: T): Getters<T> {
  throw new Error('TODO');
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
