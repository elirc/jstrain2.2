// ─────────────────────────────────────────────────────────────────────────
//  02 · renderField                                          ★★☆ core
//  concepts: truthiness narrowing · != null · ??
//  run: node ../run.js exercises/02-truthiness-trap.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  A form renderer. A field either HAS a value or is missing. Missing
//  means `null` or `undefined` — nothing else. Zero is a value. The empty
//  string is a value.
//
//      renderField('Name', 'Ada')  → 'Name: Ada'
//      renderField('Count', 0)     → 'Count: 0'        not '(none)'
//      renderField('Note', '')     → 'Note: '          not '(none)'
//      renderField('Note', null)   → 'Note: (none)'
//
//      withDefault('', 'anon')     → ''                not 'anon'
//      withDefault(null, 'anon')   → 'anon'
//
//  `if (value)` narrows too — but it narrows on TRUTHINESS, and it will
//  fail the tests below. hint: `!= null` and `??` both treat null and
//  undefined as one group and leave everything else alone.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

function probe<T>(value: T): T {
  return value;
}

export function renderField(label: string, value: TODO): string {
  throw new Error('TODO');
}

export function withDefault(value: TODO, fallback: string): string {
  throw new Error('TODO');
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
