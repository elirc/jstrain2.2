// ─────────────────────────────────────────────────────────────────────────
//  02 · renderField — SOLUTION                               ★★☆ core
//  run: node ../run.js solutions/02-truthiness-trap.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `if (value)` and `if (value != null)` narrow to the SAME
//  type here — `string | number` — so the compiler is happy either way.
//  Only the runtime tests can tell them apart, because JS has six falsy
//  values and two of them (`0` and `''`) are perfectly good field values.
//  That is the whole lesson: a type-correct guard can still be a
//  logic bug, so pick the guard that matches your INTENT ("is it
//  missing?"), not the one that is shortest to type.
//
//  `!= null` (loose, one `=`) is the deliberate exception to the
//  "always use ===" rule: it means `!== null && !== undefined`.
//  `??` is the same test as an operator, which is why `'' ?? 'anon'`
//  is `''` while `'' || 'anon'` is `'anon'`.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

function probe<T>(value: T): T {
  return value;
}

export function renderField(
  label: string,
  value: string | number | null | undefined
): string {
  if (value != null) return `${label}: ${value}`;
  return `${label}: (none)`;
}

export function withDefault(
  value: string | null | undefined,
  fallback: string
): string {
  return value ?? fallback;
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('renders a present string', () => {
  eq(renderField('Name', 'Ada'), 'Name: Ada');
});

test('keeps zero — it is a value, not a hole', () => {
  eq(renderField('Count', 0), 'Count: 0');
});

test('keeps the empty string', () => {
  eq(renderField('Note', ''), 'Note: ');
});

test('shows (none) for null and undefined', () => {
  eq(renderField('Note', null), 'Note: (none)');
  eq(renderField('Note', undefined), 'Note: (none)');
});

test('withDefault only replaces null and undefined', () => {
  eq(withDefault(null, 'anon'), 'anon');
  eq(withDefault(undefined, 'anon'), 'anon');
});

test('withDefault keeps an empty string', () => {
  eq(withDefault('', 'anon'), '');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<
  Equal<Parameters<typeof renderField>[1], string | number | null | undefined>
>;

function _typeTests() {
  const value = '' as unknown as Parameters<typeof renderField>[1];

  if (value != null) {
    const p = probe(value);
    type _present = Expect<Equal<typeof p, string | number>>;
    use(p);
  } else {
    const p = probe(value);
    type _missing = Expect<Equal<typeof p, null | undefined>>;
    use(p);
  }

  // @ts-expect-error — booleans are not renderable field values
  renderField('Flag', true);

  // @ts-expect-error — the fallback is not optional
  withDefault('a');
}
use(_typeTests);
