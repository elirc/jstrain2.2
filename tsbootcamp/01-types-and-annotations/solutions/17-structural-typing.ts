// ─────────────────────────────────────────────────────────────────────────
//  17 · structural typing — SOLUTION                        ★★★ stretch
//  run: node ../run.js solutions/17-structural-typing.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: assignability in TypeScript asks one question — does the
//  source have (at least) the members the target requires, with
//  compatible types? `Employee` was never declared to be `Named`, but it
//  has a string `name`, so it is one. Nothing else is needed: no
//  `implements`, no adapter, no import between the two declarations.
//  Duck typing, checked at compile time.
//
//  It only flows one way. `Employee → Named` drops information the target
//  never asked for; `Named → Employee` would have to invent a salary,
//  so it is rejected. That asymmetry is the whole of width subtyping.
//
//  Then the exception everyone trips on. If plain structural rules
//  applied everywhere, `{ name: 'Ada', salary: 100 }` written inline
//  where a `Named` is expected would be legal — and every typo'd or
//  leftover property would sail through. So TypeScript adds an EXCESS
//  PROPERTY CHECK for object literals that are "fresh": written directly
//  at the assignment or argument. Give that same object a name first and
//  the freshness is gone, along with the check — the pair of lines in
//  `_typeTests` is the proof, and it is worth staring at.
//
//  Practical consequences:
//    · a mistyped optional prop (`onCLick`) is caught inline and silently
//      ignored through a variable — so keep config objects inline;
//    · when you deliberately want extras, assign through a variable or
//      widen the target type, not `as any`.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface Employee {
  name: string;
  salary: number;
}

export type Named = { name: string };

export function greetAll(people: readonly Named[]): string[] {
  return people.map((person) => `Hi, ${person.name}`);
}

export function hire(name: string, salary: number): Employee {
  return { name, salary };
}

export function payroll(staff: readonly Employee[]): number {
  return staff.reduce((total, employee) => total + employee.salary, 0);
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
