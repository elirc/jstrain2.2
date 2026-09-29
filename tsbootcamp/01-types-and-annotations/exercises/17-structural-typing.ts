// ─────────────────────────────────────────────────────────────────────────
//  17 · structural typing                                   ★★★ stretch
//  concepts: structural assignability · excess property checks
//  run: node ../run.js exercises/17-structural-typing.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  TypeScript compares SHAPES, not names. Nothing declares that it
//  implements `Named`; anything with a string `name` already is one, even
//  if the two types were written by strangers a year apart. Extra
//  properties are fine — that is width subtyping, and it is why an
//  Employee can be passed anywhere a Named is wanted.
//
//  With one loud exception: a FRESH object literal is checked for excess
//  properties. `{ name: 'Ada', salary: 100 }` written inline where a
//  Named is expected is an error, because a literal with a property the
//  target has never heard of is nearly always a typo or a leak.
//
//      Named      { name: string }
//      Employee   already declared below — name plus salary
//
//      greetAll([{ name: 'Ada' }])           → ['Hi, Ada']
//      hire('Ada', 100)                      → { name: 'Ada', salary: 100 }
//      payroll([hire('Ada', 100), hire('Grace', 120)])   → 220
//
//  hint: read the failing assignments in the type tests as a pair — the
//  same object is rejected as a literal and accepted through a variable

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export interface Employee {
  name: string;
  salary: number;
}

export type Named = TODO;

export function greetAll(people: TODO): string[] {
  throw new Error('TODO');
}

export function hire(name: TODO, salary: TODO): Employee {
  throw new Error('TODO');
}

export function payroll(staff: TODO): number {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('greetAll greets everyone by name', () => {
  eq(greetAll([{ name: 'Ada' }, { name: 'Grace' }]), ['Hi, Ada', 'Hi, Grace']);
});

test('greetAll of nobody is an empty list', () => {
  eq(greetAll([]), []);
});

test('hire builds an employee', () => {
  eq(hire('Ada', 100), { name: 'Ada', salary: 100 });
});

test('payroll adds up the salaries', () => {
  eq(payroll([hire('Ada', 100), hire('Grace', 120)]), 220);
});

test('an employee is already a Named — no conversion needed', () => {
  eq(greetAll([hire('Ada', 100)]), ['Hi, Ada']);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _1 = Expect<Equal<Named, { name: string }>>;
type _2 = Expect<Equal<Parameters<typeof greetAll>[0], readonly Named[]>>;
type _3 = Expect<Equal<Parameters<typeof payroll>[0], readonly Employee[]>>;

function _typeTests() {
  const employee: Employee = { name: 'Ada', salary: 100 };
  const named: Named = employee; // width subtyping: extra members are fine
  greetAll([employee]);
  use(named);

  // @ts-expect-error — a fresh literal may not carry unknown properties
  const literal: Named = { name: 'Ada', salary: 100 };
  use(literal);

  // @ts-expect-error — the check reaches inside array literals too
  greetAll([{ name: 'Ada', salary: 100 }]);

  // @ts-expect-error — a typo is an excess property, not a rename
  const typo: Named = { name: 'Ada', naem: 'Ada' };
  use(typo);

  // the identical object through a variable: not fresh, so no check
  const wide = { name: 'Ada', salary: 100 };
  const fine: Named = wide;
  use(fine);

  // @ts-expect-error — Named is missing salary, so it is not an Employee
  const backwards: Employee = named;
  use(backwards);
}
use(_typeTests);
