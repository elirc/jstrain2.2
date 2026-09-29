// ─────────────────────────────────────────────────────────────────────────
//  09 · rebuild the utilities                               ★★★ stretch
//  concepts: mapped types · modifiers · distributive conditionals
//  run: node ../run.js exercises/09-rebuild-the-utilities.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  cold rep — you learned this in TS-04 and TS-05.
//
//  Same five views as 08, with the built-ins taken away. Write each
//  utility yourself as a mapped (or conditional) type — no Pick, Omit,
//  Partial, Required, Readonly, Record or Exclude in your answers. The
//  built-ins appear only in the type tests below, as the graders.
//
//      MyPartial<T>   every field optional      MyRequired<T>  and back
//      MyReadonly<T>  every field readonly      MyMutable<T>   and back
//      MyPick<T,K>    keys from the call site   MyExclude<T,U> minus a union
//      MyOmit<T,K>    the two composed          MyRecord<K,V>  a lookup
//
//  Then build PublicProfile / NewEmployee / UpdatePayload / AdminRow /
//  Directory out of your own utilities.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  salaryCents: number;
  managerId: string | null;
  ssn: string;
}

export interface Draft {
  readonly id: string;
  title?: string;
  body?: string;
}

export const ADA: Employee = {
  id: 'e1',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@lovelace.dev',
  salaryCents: 1_200_00,
  managerId: null,
  ssn: '000-00-0001',
};

export type MyPartial<T> = TODO;
export type MyRequired<T> = TODO;
export type MyReadonly<T> = TODO;
export type MyMutable<T> = TODO;
export type MyPick<T, K extends keyof T> = TODO;
export type MyExclude<T, U> = TODO;
export type MyOmit<T, K extends keyof T> = TODO;
export type MyRecord<K extends PropertyKey, V> = TODO;

export type PublicProfile = TODO;
export type NewEmployee = TODO;
export type UpdatePayload = TODO;
export type AdminRow = TODO;
export type Directory = TODO;

export function toPublicProfile(employee: Employee): PublicProfile {
  throw new Error('TODO');
}

export function toDirectory(employees: readonly Employee[]): Directory {
  throw new Error('TODO');
}

export function toAdminRow(employee: Employee): AdminRow {
  throw new Error('TODO');
}

export function completeDraft(draft: Draft): MyRequired<Draft> {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('the hand-built Pick still picks', () => {
  eq(toPublicProfile(ADA), { id: 'e1', firstName: 'Ada', lastName: 'Lovelace' });
});

test('the hand-built Record still indexes', () => {
  const directory = toDirectory([ADA]);
  eq(directory.e1, { id: 'e1', firstName: 'Ada', lastName: 'Lovelace' });
});

test('the hand-built Omit still drops the secret', () => {
  const row = toAdminRow(ADA) as Record<string, unknown>;
  ok(!('ssn' in row));
  eq(Object.keys(row).length, 6);
});

test('the hand-built Required fills every optional in', () => {
  eq(completeDraft({ id: 'd1' }), { id: 'd1', title: 'untitled', body: '' });
  eq(completeDraft({ id: 'd2', title: 'Notes' }).title, 'Notes');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _u1 = Expect<Equal<MyPartial<Employee>, Partial<Employee>>>;
type _u2 = Expect<Equal<MyRequired<Draft>, Required<Draft>>>;
type _u3 = Expect<Equal<MyReadonly<Employee>, Readonly<Employee>>>;
type _u4 = Expect<
  Equal<MyMutable<Draft>, { id: string; title?: string; body?: string }>
>;
type _u5 = Expect<
  Equal<MyPick<Employee, 'id' | 'email'>, Pick<Employee, 'id' | 'email'>>
>;
type _u6 = Expect<Equal<MyExclude<'a' | 'b' | 'c', 'b'>, 'a' | 'c'>>;
type _u7 = Expect<Equal<MyOmit<Employee, 'ssn'>, Omit<Employee, 'ssn'>>>;
type _u8 = Expect<Equal<MyRecord<'a' | 'b', number>, Record<'a' | 'b', number>>>;

type _v1 = Expect<
  Equal<PublicProfile, { id: string; firstName: string; lastName: string }>
>;
type _v2 = Expect<Equal<NewEmployee, Omit<Employee, 'id'>>>;
type _v3 = Expect<Equal<UpdatePayload, Partial<Omit<Employee, 'id' | 'ssn'>>>>;
type _v4 = Expect<Equal<AdminRow, Readonly<Omit<Employee, 'ssn'>>>>;
type _v5 = Expect<Equal<Directory, Record<string, PublicProfile>>>;
type _v6 = Expect<
  Equal<MyRequired<Draft>, { readonly id: string; title: string; body: string }>
>;

// @ts-expect-error — MyPick may only be given real keys of T
type _bad = MyPick<Employee, 'nope'>;

function _typeTests() {
  const row = toAdminRow(ADA);

  // @ts-expect-error — MyReadonly means what Readonly means
  row.salaryCents = 0;

  // @ts-expect-error — MyOmit really removed the key
  row.ssn;

  // @ts-expect-error — MyPick is not partial: lastName is still required
  const profile: PublicProfile = { id: 'e1', firstName: 'Ada' };
  use(profile);

  const patch: UpdatePayload = { email: 'a@b.c' };
  use(patch);

  // @ts-expect-error — MyPartial keeps the value types
  const wrong: UpdatePayload = { salaryCents: '1200' };
  use(wrong);

  const filled = completeDraft({ id: 'd1' });
  const title: string = filled.title;
  use(title);

  // @ts-expect-error — MyRequired removed `?`, it did not remove readonly
  filled.id = 'd2';
}
use(_typeTests);
