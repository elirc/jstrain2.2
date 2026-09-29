// ─────────────────────────────────────────────────────────────────────────
//  08 · employee DTOs — SOLUTION                            ★★☆ core
//  run: node ../run.js solutions/08-employee-dtos.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: one source of truth, five views derived from it. Add a
//  column to Employee tomorrow and every view updates — that is the entire
//  argument for deriving instead of hand-writing a second interface.
//
//  Which utility, and why:
//    · PublicProfile → Pick. An allow-list. For anything that leaves the
//      process prefer Pick: add `resetToken` next week and Omit publishes
//      it silently, while Pick silently drops it. Fail closed.
//    · NewEmployee → Omit<'id'>. The ergonomic case: everything except the
//      one field the database generates.
//    · UpdatePayload → Partial<Omit<...>>. Order matters when you read it:
//      remove what may never be patched, THEN make the rest optional.
//    · AdminRow → Readonly. One level deep only — it stops assignment to
//      the row's own fields, and nothing more.
//    · Directory → Record<string, PublicProfile>. An index signature, so
//      the lookup type is `PublicProfile | undefined` only if you turn on
//      noUncheckedIndexedAccess; here it is `PublicProfile`, which is a
//      real thing to know about your own config.
//
//  `applyUpdate` is a plain spread: `Partial<T>` over `T` type-checks
//  without a cast, and undefined values are never introduced because a
//  missing key is missing, not present-and-undefined.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  salaryCents: number;
  managerId: string | null;
  startedOn: string;
  ssn: string;
}

export const ADA: Employee = {
  id: 'e1',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@lovelace.dev',
  salaryCents: 1_200_00,
  managerId: null,
  startedOn: '1843-01-01',
  ssn: '000-00-0001',
};

export const BO: Employee = {
  id: 'e2',
  firstName: 'Bo',
  lastName: 'Diddley',
  email: 'bo@lovelace.dev',
  salaryCents: 900_00,
  managerId: 'e1',
  startedOn: '1955-03-02',
  ssn: '000-00-0002',
};

export type PublicProfile = Pick<Employee, 'id' | 'firstName' | 'lastName'>;
export type NewEmployee = Omit<Employee, 'id'>;
export type UpdatePayload = Partial<Omit<Employee, 'id' | 'ssn'>>;
export type AdminRow = Readonly<Omit<Employee, 'ssn'>>;
export type Directory = Record<string, PublicProfile>;

export function toPublicProfile(employee: Employee): PublicProfile {
  const { id, firstName, lastName } = employee;
  return { id, firstName, lastName };
}

export function toAdminRow(employee: Employee): AdminRow {
  const { ssn, ...rest } = employee;
  return rest;
}

export function toDirectory(employees: readonly Employee[]): Directory {
  const out: Directory = {};
  for (const employee of employees) {
    out[employee.id] = toPublicProfile(employee);
  }
  return out;
}

export function applyUpdate(
  employee: Employee,
  patch: UpdatePayload
): Employee {
  return { ...employee, ...patch };
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('the public profile is three fields and no secrets', () => {
  eq(toPublicProfile(ADA), { id: 'e1', firstName: 'Ada', lastName: 'Lovelace' });
});

test('the admin row keeps everything except the ssn', () => {
  const row = toAdminRow(ADA) as Record<string, unknown>;
  ok(!('ssn' in row), 'the ssn must not survive');
  eq(row.salaryCents, 1_200_00);
  eq(Object.keys(row).length, 7);
});

test('the directory is keyed by id', () => {
  const directory = toDirectory([ADA, BO]);
  eq(Object.keys(directory), ['e1', 'e2']);
  eq(directory.e2, { id: 'e2', firstName: 'Bo', lastName: 'Diddley' });
});

test('applyUpdate merges only the keys the patch carries', () => {
  const updated = applyUpdate(ADA, { email: 'ada@analytical.engine' });
  eq(updated.email, 'ada@analytical.engine');
  eq(updated.firstName, 'Ada');
  eq(updated.ssn, ADA.ssn);
});

test('an empty patch changes nothing and mutates nothing', () => {
  eq(applyUpdate(ADA, {}), ADA);
  eq(ADA.email, 'ada@lovelace.dev');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _t1 = Expect<
  Equal<PublicProfile, { id: string; firstName: string; lastName: string }>
>;
type _t2 = Expect<
  Equal<
    NewEmployee,
    {
      firstName: string;
      lastName: string;
      email: string;
      salaryCents: number;
      managerId: string | null;
      startedOn: string;
      ssn: string;
    }
  >
>;
type _t3 = Expect<
  Equal<
    UpdatePayload,
    {
      firstName?: string;
      lastName?: string;
      email?: string;
      salaryCents?: number;
      managerId?: string | null;
      startedOn?: string;
    }
  >
>;
type _t4 = Expect<
  Equal<
    AdminRow,
    {
      readonly id: string;
      readonly firstName: string;
      readonly lastName: string;
      readonly email: string;
      readonly salaryCents: number;
      readonly managerId: string | null;
      readonly startedOn: string;
    }
  >
>;
type _t5 = Expect<Equal<Directory, { [key: string]: PublicProfile }>>;

function _typeTests() {
  const profile = toPublicProfile(ADA);

  // @ts-expect-error — the public profile carries no email
  profile.email;

  const row = toAdminRow(ADA);
  const salary: number = row.salaryCents;
  use(salary);

  // @ts-expect-error — an admin row is readonly
  row.salaryCents = 0;

  // @ts-expect-error — and the ssn is not on it at all
  row.ssn;

  const empty: UpdatePayload = {};
  use(empty);

  // @ts-expect-error — the id may never be patched
  applyUpdate(ADA, { id: 'e9' });

  // @ts-expect-error — nor the ssn
  applyUpdate(ADA, { ssn: '000-00-0003' });

  // @ts-expect-error — optional does not mean untyped
  applyUpdate(ADA, { salaryCents: '1200' });
}
use(_typeTests);
