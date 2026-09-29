// ─────────────────────────────────────────────────────────────────────────
//  01 · form event reducer                                  ★★☆ core
//  concepts: discriminated unions · exhaustive switch · never
//  run: node ../run.js exercises/01-form-event-reducer.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  cold rep — you learned this in TS-02.
//
//  A form widget emits four events, each with its own payload:
//
//      focus  { field }            change  { field, value }
//      blur   { field }            submit  { at }
//
//  Write the union, then reduce it with a switch that tsc can prove is
//  exhaustive, and an assertNever that only compiles in a dead branch.
//
//      reduce(EMPTY, { type: 'focus', field: 'email' }).focused → 'email'
//      reduce(EMPTY, { type: 'submit', at: 12 }).submittedAt    → 12

import { test, eq, ok, throws } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export interface FormState {
  values: Record<string, string>;
  touched: string[];
  focused: string | null;
  submittedAt: number | null;
}

export const EMPTY: FormState = {
  values: {},
  touched: [],
  focused: null,
  submittedAt: null,
};

export type FormEvent = TODO;

export function reduce(state: FormState, event: FormEvent): FormState {
  throw new Error('TODO');
}

export function assertNever(value: TODO): TODO {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('focus records which field has the caret', () => {
  eq(reduce(EMPTY, { type: 'focus', field: 'email' }).focused, 'email');
});

test('change writes one value and leaves the rest alone', () => {
  const one = reduce(EMPTY, { type: 'change', field: 'email', value: 'a@b.c' });
  const two = reduce(one, { type: 'change', field: 'name', value: 'Ada' });
  eq(two.values, { email: 'a@b.c', name: 'Ada' });
});

test('blur clears focus and marks the field touched exactly once', () => {
  const focused = reduce(EMPTY, { type: 'focus', field: 'email' });
  const once = reduce(focused, { type: 'blur', field: 'email' });
  const twice = reduce(once, { type: 'blur', field: 'email' });
  eq(twice.focused, null);
  eq(twice.touched, ['email']);
});

test('submit stamps the time and drops focus', () => {
  const done = reduce(EMPTY, { type: 'submit', at: 1700000000 });
  eq(done.submittedAt, 1700000000);
  eq(done.focused, null);
});

test('reduce never mutates the state it was handed', () => {
  const before = reduce(EMPTY, { type: 'change', field: 'a', value: '1' });
  reduce(before, { type: 'change', field: 'b', value: '2' });
  eq(before.values, { a: '1' });
  ok(EMPTY.touched.length === 0);
});

test('an event that slips past the compiler blows up loudly', () => {
  throws(
    () => reduce(EMPTY, { type: 'reset' } as unknown as FormEvent),
    'unhandled variant'
  );
});

// ──────────────────────────── type tests ─────────────────────────────────

type _t1 = Expect<
  Equal<FormEvent['type'], 'focus' | 'change' | 'blur' | 'submit'>
>;
type _t2 = Expect<
  Equal<
    Extract<FormEvent, { type: 'change' }>,
    { type: 'change'; field: string; value: string }
  >
>;
type _t3 = Expect<Equal<Parameters<typeof assertNever>[0], never>>;
type _t4 = Expect<Equal<ReturnType<typeof reduce>, FormState>>;

function _typeTests() {
  const queue: FormEvent[] = [
    { type: 'change', field: 'email', value: 'a' },
    { type: 'submit', at: 1 },
  ];
  const event = queue[0]!;
  if (event.type === 'change') {
    const value: string = event.value;
    use(value);
  }

  // @ts-expect-error — value lives on the change variant only
  event.value;

  // @ts-expect-error — focus carries a field and nothing else
  reduce(EMPTY, { type: 'focus', field: 'email', value: 'a' });

  // @ts-expect-error — submit is stamped with `at`, not a field
  reduce(EMPTY, { type: 'submit', field: 'email' });

  // @ts-expect-error — 'reset' is not one of the four variants
  reduce(EMPTY, { type: 'reset' });

  // @ts-expect-error — assertNever accepts never, and a string is not never
  assertNever('reset');
}
use(_typeTests);
