// ─────────────────────────────────────────────────────────────────────────
//  07 · form patch — SOLUTION                               ★★★ stretch
//  run: node ../run.js solutions/07-form-patch.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `setField` is the two-parameter pattern with the payoff in
//  the third argument — `value: T[K]` reads the type AT the chosen key, so
//  'theme' demands 'light' | 'dark' and 'age' demands a number. One type
//  parameter cannot express that; `value: T[keyof T]` would let you write
//  a string into age.
//
//  The cast in the body is the interesting part. `{ ...form, [key]: value }`
//  does NOT produce T: a computed key in an object literal widens, so tsc
//  infers `T & { [x: string]: T[K] }` and cannot prove the result still has
//  every field of T. Everyone hits this. One `as T`, on the line that makes
//  it true, is the accepted answer.
//
//  `diff` returns `Partial<T>` because absence is the point — a key that
//  did not change is missing, not undefined. `Object.keys` gives string[]
//  by design (an object can carry more keys at runtime than its type
//  admits), so the `as (keyof T)[]` is a deliberate, local claim about an
//  object you own.
//
//  `applyPatch` needs no cast at all: spreading `Partial<T>` over `T` is
//  something tsc can check. Notice the round trip in the tests —
//  applyPatch(before, diff(before, after)) must equal after. That is the
//  property worth testing, not the individual keys.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface Profile {
  displayName: string;
  email: string;
  age: number;
  newsletter: boolean;
  theme: 'light' | 'dark';
}

export const ADA: Profile = {
  displayName: 'Ada',
  email: 'ada@lovelace.dev',
  age: 36,
  newsletter: false,
  theme: 'light',
};

export function setField<T extends object, K extends keyof T>(
  form: T,
  key: K,
  value: T[K]
): T {
  return { ...form, [key]: value } as T;
}

export function diff<T extends object>(before: T, after: T): Partial<T> {
  const out: Partial<T> = {};
  for (const key of Object.keys(after) as (keyof T)[]) {
    if (!Object.is(before[key], after[key])) out[key] = after[key];
  }
  return out;
}

export function applyPatch<T extends object>(form: T, patch: Partial<T>): T {
  return { ...form, ...patch };
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('setField changes one field and copies the rest', () => {
  const next = setField(ADA, 'age', 37);
  eq(next, { ...ADA, age: 37 });
});

test('setField never mutates the form it was given', () => {
  setField(ADA, 'theme', 'dark');
  eq(ADA.theme, 'light');
});

test('diff reports only what actually changed', () => {
  const next = setField(setField(ADA, 'age', 37), 'theme', 'dark');
  eq(diff(ADA, next), { age: 37, theme: 'dark' });
});

test('diff of two equal forms is empty, not full of undefined', () => {
  const patch = diff(ADA, { ...ADA });
  eq(Object.keys(patch), []);
  ok(!('age' in patch));
});

test('applyPatch puts a diff back where it came from', () => {
  const next = setField(setField(ADA, 'newsletter', true), 'email', 'a@b.c');
  eq(applyPatch(ADA, diff(ADA, next)), next);
});

test('an empty patch is an identity', () => {
  eq(applyPatch(ADA, {}), ADA);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _t1 = Expect<Equal<ReturnType<typeof diff<Profile>>, Partial<Profile>>>;
type _t2 = Expect<
  Equal<Parameters<typeof setField<Profile, 'theme'>>[2], 'light' | 'dark'>
>;
type _t3 = Expect<Equal<ReturnType<typeof setField<Profile, 'age'>>, Profile>>;
type _t4 = Expect<Equal<Parameters<typeof applyPatch<Profile>>[1], Partial<Profile>>>;

function _typeTests() {
  const dark = setField(ADA, 'theme', 'dark');
  const theme: 'light' | 'dark' = dark.theme;
  use(theme);

  // @ts-expect-error — age is a number, not a numeric string
  setField(ADA, 'age', '37');

  // @ts-expect-error — nickname is not a field of Profile
  setField(ADA, 'nickname', 'Addy');

  // @ts-expect-error — theme is a two-way literal union
  setField(ADA, 'theme', 'blue');

  const patch = diff(ADA, dark);
  const maybeAge: number | undefined = patch.age;
  use(maybeAge);

  // @ts-expect-error — Partial means every field may be missing
  const definitelyAge: number = patch.age;
  use(definitelyAge);

  // @ts-expect-error — a patch may only carry fields of the same shape
  applyPatch(ADA, { nickname: 'Addy' });

  // @ts-expect-error — and they must still hold the right types
  applyPatch(ADA, { age: '37' });
}
use(_typeTests);
