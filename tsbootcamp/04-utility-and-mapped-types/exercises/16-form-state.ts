// ─────────────────────────────────────────────────────────────────────────
//  16 · form state — capstone                               ★★★ stretch
//  concepts: mapped types over a generic T · keyed updates · immutability
//  run: node ../run.js exercises/16-form-state.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Every form library is the same three parallel objects, keyed the same
//  way: the values, one optional error per field, one boolean per field.
//  Written by hand for each form they drift; written as a mapped type over
//  T they cannot.
//
//      FormState<{ email: string; age: number }>
//        →  { values:  { email: string; age: number }
//             errors:  { email?: string; age?: string }
//             touched: { email: boolean; age: boolean } }
//
//  Then the updates, all returning a NEW state (never mutating):
//
//      createForm(values)              seeds errors {} and touched false
//      setField(state, key, value)     value must match THAT key's type,
//                                      marks it touched, clears its error
//      setError(state, key, message)   records one field error
//      isValid(state)                  no errors recorded
//
//  setField is the one that earns the module: `key` is a second type
//  parameter constrained to `keyof T`, and `value` is `T[K]` — so
//  `setField(form, 'age', 'old')` is a compile error, not a runtime one.
//
//  hint: `{ ...state.values, [key]: value }` is the whole update; `delete
//  errors[key]` compiles only because every error key is optional

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type FormState<T> = TODO;

export interface SignUp {
  email: string;
  age: number;
}

export function createForm<T extends object>(values: T): FormState<T> {
  throw new Error('TODO');
}

export function setField<T extends object, K extends keyof T>(
  state: FormState<T>,
  key: K,
  value: T[K]
): FormState<T> {
  throw new Error('TODO');
}

export function setError<T extends object, K extends keyof T>(
  state: FormState<T>,
  key: K,
  message: string
): FormState<T> {
  throw new Error('TODO');
}

export function isValid<T extends object>(state: FormState<T>): boolean {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

const initial: SignUp = { email: '', age: 0 };

test('a fresh form has no errors and nothing touched', () => {
  const form = createForm(initial);
  eq(form.values, { email: '', age: 0 });
  eq(form.errors, {});
  eq(form.touched, { email: false, age: false });
  ok(isValid(form));
});

test('setField writes the value and marks the field touched', () => {
  const form = setField(createForm(initial), 'email', 'ada@example.com');
  eq(form.values, { email: 'ada@example.com', age: 0 });
  eq(form.touched, { email: true, age: false });
});

test('setField does not mutate the previous state', () => {
  const before = createForm(initial);
  setField(before, 'age', 36);
  eq(before.values, { email: '', age: 0 });
  eq(before.touched, { email: false, age: false });
});

test('setError records a message and invalidates the form', () => {
  const form = setError(createForm(initial), 'email', 'required');
  eq(form.errors, { email: 'required' });
  ok(!isValid(form));
});

test('editing a field clears its error but leaves the others', () => {
  const withErrors = setError(
    setError(createForm(initial), 'email', 'required'),
    'age',
    'too low'
  );
  const fixed = setField(withErrors, 'email', 'ada@example.com');
  eq(fixed.errors, { age: 'too low' });
  ok(!isValid(fixed));
});

// ──────────────────────────── type tests ─────────────────────────────────

type _t1 = Expect<
  Equal<
    FormState<SignUp>,
    {
      values: SignUp;
      errors: { email?: string; age?: string };
      touched: { email: boolean; age: boolean };
    }
  >
>;
type _t2 = Expect<Equal<FormState<SignUp>['values'], SignUp>>;
// the loops are homomorphic, so an optional field stays optional in
// `touched` too — `-?` is what you would add to force them all present
type _t3 = Expect<
  Equal<FormState<{ nickname?: string }>['touched'], { nickname?: boolean }>
>;
type _t4 = Expect<
  Equal<ReturnType<typeof setField<SignUp, 'email'>>, FormState<SignUp>>
>;

function _typeTests() {
  const form = createForm({ email: '', age: 0 });

  const age: number = form.values.age;
  const emailError: string | undefined = form.errors.email;
  use(age, emailError);

  setField(form, 'age', 36);

  // @ts-expect-error — 'nope' is not a field of this form
  setField(form, 'nope', 1);

  // @ts-expect-error — age is a number, not a string
  setField(form, 'age', 'old');

  // @ts-expect-error — setError only knows the form's own fields
  setError(form, 'nope', 'boom');

  // @ts-expect-error — touched is a boolean per field, not a list
  const wrong: FormState<SignUp>['touched'] = { email: 'yes', age: false };
  use(wrong);
}
use(_typeTests);
