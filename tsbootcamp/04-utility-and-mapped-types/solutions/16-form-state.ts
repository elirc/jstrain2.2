// ─────────────────────────────────────────────────────────────────────────
//  16 · form state — capstone — SOLUTION                    ★★★ stretch
//  run: node ../run.js solutions/16-form-state.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three loops over the same key set.
//
//      type FormState<T> = {
//        values: T;
//        errors: { [K in keyof T]?: string };
//        touched: { [K in keyof T]: boolean };
//      };
//
//  `errors` reuses the key union with a constant value type and a `?`;
//  `touched` does the same with `boolean`. One generic parameter keeps all
//  three objects keyed identically forever — that is the whole design.
//
//  `setField<T, K extends keyof T>(state, key, value: T[K])` is the shape
//  worth memorising. TWO type parameters: one for the object, one for the
//  key, with the value's type read back out of the object by index. That
//  pairing is what makes `setField(form, 'age', 'old')` a compile error
//  while a single `key: keyof T` would let it through with `value:
//  string | number`.
//
//  Two runtime details tsc actually helps with:
//
//  * `delete errors[key]` only compiles because every key of `errors` is
//    optional. Deleting a required property is an error — the type system
//    catching a real class of bug.
//  * Nothing is mutated. Each function builds new objects, so the previous
//    state stays valid (test three) — the invariant every undo stack, React
//    re-render and time-travel debugger depends on.
//
//  `_t3` records a sharp edge: the loops are homomorphic, so an OPTIONAL
//  field of T stays optional in `touched` as well. If you want a boolean
//  for every field regardless, write `{ [K in keyof T]-?: boolean }`.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type FormState<T> = {
  values: T;
  errors: { [K in keyof T]?: string };
  touched: { [K in keyof T]: boolean };
};

export interface SignUp {
  email: string;
  age: number;
}

export function createForm<T extends object>(values: T): FormState<T> {
  const touched = Object.fromEntries(
    Object.keys(values).map((key) => [key, false])
  ) as FormState<T>['touched'];
  return { values: { ...values }, errors: {}, touched };
}

export function setField<T extends object, K extends keyof T>(
  state: FormState<T>,
  key: K,
  value: T[K]
): FormState<T> {
  const errors = { ...state.errors };
  delete errors[key];
  return {
    values: { ...state.values, [key]: value },
    errors,
    touched: { ...state.touched, [key]: true },
  };
}

export function setError<T extends object, K extends keyof T>(
  state: FormState<T>,
  key: K,
  message: string
): FormState<T> {
  return {
    values: state.values,
    errors: { ...state.errors, [key]: message },
    touched: state.touched,
  };
}

export function isValid<T extends object>(state: FormState<T>): boolean {
  return Object.keys(state.errors).length === 0;
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
