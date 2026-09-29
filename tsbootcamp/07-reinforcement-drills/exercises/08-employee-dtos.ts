// ─────────────────────────────────────────────────────────────────────────
//  08 · employee DTOs                                       ★★☆ core
//  concepts: Pick · Omit · Partial · Readonly · Record
//  run: node ../run.js exercises/08-employee-dtos.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  cold rep — you learned this in TS-04.
//
//  One Employee type, five API views derived from it. Never hand-write a
//  second interface; each view is one line built out of the utilities.
//
//      PublicProfile   id, firstName, lastName — nothing else leaves
//      NewEmployee     everything except id (the database makes it)
//      UpdatePayload   any subset, but never id and never ssn
//      AdminRow        everything except ssn, and nothing is writable
//      Directory       a lookup from id to PublicProfile
//
//  Each one is pinned by an Expect<Equal>, so "close enough" fails.

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

export type PublicProfile = TODO;
export type NewEmployee = TODO;
export type UpdatePayload = TODO;
export type AdminRow = TODO;
export type Directory = TODO;

export function toPublicProfile(employee: Employee): PublicProfile {
  throw new Error('TODO');
}

export function toAdminRow(employee: Employee): AdminRow {
  throw new Error('TODO');
}

export function toDirectory(employees: readonly Employee[]): Directory {
  throw new Error('TODO');
}

export function applyUpdate(
  employee: Employee,
  patch: UpdatePayload
): Employee {
  throw new Error('TODO');
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
