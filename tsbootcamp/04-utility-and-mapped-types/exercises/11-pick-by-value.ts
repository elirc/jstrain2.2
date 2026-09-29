// ─────────────────────────────────────────────────────────────────────────
//  11 · PickByValue and OmitByValue                         ★★★ stretch
//  concepts: filtering keys with `as` · never removes a key
//  run: node ../run.js exercises/11-pick-by-value.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Pick and Omit filter by KEY. Sometimes you want to filter by VALUE:
//  "give me the string columns", "give me only the methods".
//
//      PickByValue<{ id: string; width: number }, string>
//        →  { id: string }
//      OmitByValue<{ id: string; width: number }, string>
//        →  { width: number }
//
//  The mechanism is the `as` clause from exercise 09 plus one fact: a key
//  remapped to `never` disappears from the result. So map each key to
//  itself when the value matches, and to `never` when it does not.
//
//  Then pluckStrings does it at runtime with `typeof`.
//
//  hint: `T[K] extends V ? K : never` inside the `as` — and note this is
//  an `extends` test, not an equality test, so a `string | number` column
//  is NOT a string column

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type PickByValue<T, V> = TODO;
export type OmitByValue<T, V> = TODO;

export interface Widget {
  id: string;
  label: string;
  width: number;
  visible: boolean;
  onClick: () => void;
}

export function pluckStrings<T extends object>(obj: T): PickByValue<T, string> {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('keeps only the string-valued properties', () => {
  eq(pluckStrings({ name: 'Ada', age: 36, tag: 'x' }), {
    name: 'Ada',
    tag: 'x',
  });
});

test('no strings, empty object', () => {
  eq(pluckStrings({ age: 36, ok: true }), {});
});

test('keeps the empty string — it is still a string', () => {
  eq(pluckStrings({ note: '', age: 1 }), { note: '' });
});

test('does not mutate the source', () => {
  const widget = { name: 'Ada', age: 36 };
  pluckStrings(widget);
  eq(widget, { name: 'Ada', age: 36 });
});

// ──────────────────────────── type tests ─────────────────────────────────

type _t1 = Expect<
  Equal<PickByValue<Widget, string>, { id: string; label: string }>
>;
type _t2 = Expect<
  Equal<
    OmitByValue<Widget, string>,
    { width: number; visible: boolean; onClick: () => void }
  >
>;
// the two halves partition the object
type _t3 = Expect<
  Equal<
    keyof PickByValue<Widget, string> | keyof OmitByValue<Widget, string>,
    keyof Widget
  >
>;
// methods-only is the same type with a function as V
type _t4 = Expect<
  Equal<keyof PickByValue<Widget, (...args: never[]) => unknown>, 'onClick'>
>;
// an OPTIONAL string is `string | undefined`, which does not extend string
type _t5 = Expect<
  Equal<PickByValue<{ a: string; b?: string }, string>, { a: string }>
>;
type _t6 = Expect<
  Equal<OmitByValue<{ a: string; b?: string }, string>, { b?: string }>
>;
// ...and neither does a union that is only partly string
type _t7 = Expect<Equal<PickByValue<{ a: string | number }, string>, {}>>;

function _typeTests() {
  const strings = pluckStrings({ name: 'Ada', age: 36 });
  const name: string = strings.name;
  use(name);

  // @ts-expect-error — a number-valued key did not survive the filter
  strings.age;

  // @ts-expect-error — and the filtered-out keys are gone from the type
  const wrong: PickByValue<Widget, string> = { id: 'a', label: 'b', width: 1 };
  use(wrong);
}
use(_typeTests);
