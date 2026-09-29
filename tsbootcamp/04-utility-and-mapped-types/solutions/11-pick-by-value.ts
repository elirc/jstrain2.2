// ─────────────────────────────────────────────────────────────────────────
//  11 · PickByValue and OmitByValue — SOLUTION              ★★★ stretch
//  run: node ../run.js solutions/11-pick-by-value.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//
//      type PickByValue<T, V> =
//        { [K in keyof T as T[K] extends V ? K : never]: T[K] };
//      type OmitByValue<T, V> =
//        { [K in keyof T as T[K] extends V ? never : K]: T[K] };
//
//  Two rules make this work. First, an `as` clause that produces `never`
//  drops the key entirely — that is the filter. Second, `T[K]` inside the
//  loop is per-key, so the conditional is evaluated once per property
//  rather than once for the whole object.
//
//  The trap the type tests pin down: `extends` is ASSIGNABILITY, not
//  equality. An optional `b?: string` has the type `string | undefined`,
//  which does not extend `string`, so PickByValue drops it and
//  OmitByValue keeps it (_t5, _t6). Same for a `string | number` column
//  (_t7). If you want "could be a string", test the other direction
//  (`V extends T[K]`) or strip undefined first with
//  `NonNullable<T[K]> extends V`. Decide deliberately — the two read
//  almost identically and behave nothing alike.
//
//  `(...args: never[]) => unknown` is the "any function" pattern for V:
//  `never[]` parameters accept any parameter list (contravariance) and
//  `unknown` accepts any return.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type PickByValue<T, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};

export type OmitByValue<T, V> = {
  [K in keyof T as T[K] extends V ? never : K]: T[K];
};

export interface Widget {
  id: string;
  label: string;
  width: number;
  visible: boolean;
  onClick: () => void;
}

export function pluckStrings<T extends object>(obj: T): PickByValue<T, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') out[key] = value;
  }
  return out as PickByValue<T, string>;
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
