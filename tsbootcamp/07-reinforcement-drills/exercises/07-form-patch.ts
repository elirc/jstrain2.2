// ─────────────────────────────────────────────────────────────────────────
//  07 · form patch                                          ★★★ stretch
//  concepts: T[K] · Partial<T> · computed keys widen
//  run: node ../run.js exercises/07-form-patch.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  cold rep — you learned this in TS-03 and TS-04.
//
//  Three helpers for editing a form immutably. The value written must
//  match the type at the key; the diff must carry only what changed.
//
//      setField(ADA, 'age', 37)        → a new Profile, age 37
//      setField(ADA, 'theme', 'blue')  → compile error
//      setField(ADA, 'age', '37')      → compile error
//      diff(ADA, next)                 → { age: 37, theme: 'dark' }
//      applyPatch(ADA, diff(ADA, next))→ next

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

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

export function setField(form: TODO, key: TODO, value: TODO): TODO {
  throw new Error('TODO');
}

export function diff(before: TODO, after: TODO): TODO {
  throw new Error('TODO');
}

export function applyPatch(form: TODO, patch: TODO): TODO {
  throw new Error('TODO');
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
