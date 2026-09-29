// ─────────────────────────────────────────────────────────────────────────
//  09 · rebuild the utilities — SOLUTION                    ★★★ stretch
//  run: node ../run.js solutions/09-rebuild-the-utilities.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: every one of these is a mapped type — `{ [P in Keys]: … }`
//  — plus a modifier or a filter. Once you have written them by hand the
//  lib.d.ts versions stop being magic.
//
//    · `[P in keyof T]` with `?` adds optionality; with `-?` removes it.
//    · `readonly` adds; `-readonly` removes. The minus forms are the ones
//      people forget exist.
//    · MyPick maps over K, not over keyof T — the keys come from the call.
//    · MyExclude is a DISTRIBUTIVE conditional: a naked type parameter on
//      the left means it runs once per member of the union, so
//      MyExclude<'a'|'b','b'> is 'a'|never = 'a'. Wrap it in a tuple
//      ([T] extends [U]) and that distribution stops — which is exactly
//      how IsNever is written.
//    · MyOmit is then MyPick composed with MyExclude. The key-remapping
//      spelling `{ [P in keyof T as P extends K ? never : P]: T[P] }` is
//      equivalent; remapping to `never` drops the key.
//    · MyRecord constrains K to PropertyKey (string | number | symbol),
//      the type of everything that can be an object key.
//
//  One real difference to know: `[P in keyof T]` over an interface is
//  HOMOMORPHIC — it copies readonly/optional modifiers from the source
//  unless you say otherwise. `[P in K]` is not, which is why MyPick's
//  output drops nothing but also preserves nothing you did not map.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

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

export type MyPartial<T> = { [P in keyof T]?: T[P] };
export type MyRequired<T> = { [P in keyof T]-?: T[P] };
export type MyReadonly<T> = { readonly [P in keyof T]: T[P] };
export type MyMutable<T> = { -readonly [P in keyof T]: T[P] };
export type MyPick<T, K extends keyof T> = { [P in K]: T[P] };
export type MyExclude<T, U> = T extends U ? never : T;
export type MyOmit<T, K extends keyof T> = MyPick<T, MyExclude<keyof T, K>>;
export type MyRecord<K extends PropertyKey, V> = { [P in K]: V };

export type PublicProfile = MyPick<Employee, 'id' | 'firstName' | 'lastName'>;
export type NewEmployee = MyOmit<Employee, 'id'>;
export type UpdatePayload = MyPartial<MyOmit<Employee, 'id' | 'ssn'>>;
export type AdminRow = MyReadonly<MyOmit<Employee, 'ssn'>>;
export type Directory = MyRecord<string, PublicProfile>;

export function toPublicProfile(employee: Employee): PublicProfile {
  const { id, firstName, lastName } = employee;
  return { id, firstName, lastName };
}

export function toDirectory(employees: readonly Employee[]): Directory {
  const out: Directory = {};
  for (const employee of employees) out[employee.id] = toPublicProfile(employee);
  return out;
}

export function toAdminRow(employee: Employee): AdminRow {
  const { ssn, ...rest } = employee;
  return rest;
}

export function completeDraft(draft: Draft): MyRequired<Draft> {
  return {
    id: draft.id,
    title: draft.title ?? 'untitled',
    body: draft.body ?? '',
  };
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
