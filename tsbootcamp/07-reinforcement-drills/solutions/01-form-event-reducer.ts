// ─────────────────────────────────────────────────────────────────────────
//  01 · form event reducer — SOLUTION                       ★★☆ core
//  run: node ../run.js solutions/01-form-event-reducer.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: four object types joined by `|`, each pinned by a literal
//  `type` field. That literal is the whole trick — it is what lets tsc
//  narrow `event` to one member inside each `case`, so `event.value` is
//  legal under `case 'change'` and nowhere else.
//
//  The `default` branch is not defensive programming, it is a compile-time
//  proof: inside it `event` has been narrowed to `never`, and `never` is
//  the only type `assertNever` accepts. Add a fifth variant tomorrow and
//  the call stops compiling until you handle it — the error lands in the
//  reducer, not in production.
//
//  Classic wrong turn: `{ type: string; field?: string; value?: string }`.
//  It compiles, it accepts every event, and it narrows absolutely nothing,
//  so every access is `string | undefined` forever.

import { test, eq, ok, throws } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

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

export type FormEvent =
  | { type: 'focus'; field: string }
  | { type: 'change'; field: string; value: string }
  | { type: 'blur'; field: string }
  | { type: 'submit'; at: number };

export function reduce(state: FormState, event: FormEvent): FormState {
  switch (event.type) {
    case 'focus':
      return { ...state, focused: event.field };
    case 'change':
      return {
        ...state,
        values: { ...state.values, [event.field]: event.value },
      };
    case 'blur':
      return {
        ...state,
        focused: null,
        touched: state.touched.includes(event.field)
          ? state.touched
          : [...state.touched, event.field],
      };
    case 'submit':
      return { ...state, focused: null, submittedAt: event.at };
    default:
      return assertNever(event);
  }
}

export function assertNever(value: never): never {
  throw new Error(`unhandled variant: ${JSON.stringify(value)}`);
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
