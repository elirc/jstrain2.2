// ─────────────────────────────────────────────────────────────────────────
//  10 · assertion functions in practice                    ★★☆ core
//  concepts: asserts x is T · NonNullable · schema-lite narrowing
//  run: node ../run.js exercises/10-assertion-functions.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  A type guard answers a question; an assertion function makes a
//  promise. `asserts value is T` means "if this returns at all, value is
//  a T from here on" — the narrowing survives past the call, which is
//  what you want when walking JSON you did not create.
//
//      assertDefined(maybe)         → maybe is NonNullable after this line
//      assertShape(json, { name: 'string', age: 'number' })
//                                   → json is { name: string; age: number }
//
//      firstLine('a\nb')            → 'a'
//      firstLine(null)              → throws TypeError('text is null')
//      readSettings({ theme: 'dark', fontSize: 14, compact: false })
//                                   → the same object, now typed
//      readSettings({ theme: 42 })  → throws TypeError('theme must be a string')
//
//  `ShapeOf` is the mapped type that turns a schema of tag strings into
//  the object type it describes.
//
//  hint: an `asserts` function must have an EXPLICIT return annotation —
//  it can never be inferred — and its body has to throw on failure, not
//  return false

import { test, eq, ok, throws } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type FieldType = 'string' | 'number' | 'boolean';
export type Schema = Record<string, FieldType>;

export type ShapeOf<S extends Schema> = TODO;

export function assertDefined(value: TODO, label: TODO = 'value'): TODO {
  throw new Error('TODO');
}

export function assertShape(value: TODO, schema: TODO): TODO {
  throw new Error('TODO');
}

export interface Settings {
  theme: string;
  fontSize: number;
  compact: boolean;
}

// these two are complete — they are what the assertions are FOR.
// they will not compile until your assertion signatures narrow properly.
export function firstLine(text: string | null | undefined): string {
  assertDefined(text, 'text');
  return text.split('\n')[0];
}

export function readSettings(json: unknown): Settings {
  assertShape(json, { theme: 'string', fontSize: 'number', compact: 'boolean' } as const);
  return json;
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('firstLine reads the first line of a present string', () => {
  eq(firstLine('alpha\nbeta'), 'alpha');
  eq(firstLine('only'), 'only');
});

test('firstLine throws, naming the label it was given', () => {
  throws(() => firstLine(null), 'text is null');
  throws(() => firstLine(undefined), 'text is undefined');
});

test('readSettings hands back an object that matches the schema', () => {
  const raw: unknown = JSON.parse('{"theme":"dark","fontSize":14,"compact":false}');
  eq(readSettings(raw), { theme: 'dark', fontSize: 14, compact: false });
});

test('readSettings ignores keys the schema never mentioned', () => {
  const raw: unknown = { theme: 'dark', fontSize: 14, compact: false, extra: 1 };
  ok(readSettings(raw).theme === 'dark', 'expected the extra key to be tolerated');
});

test('readSettings names the field that was wrong', () => {
  throws(() => readSettings({ theme: 42, fontSize: 14, compact: false }), 'theme must be a string');
  throws(() => readSettings({ theme: 'dark', fontSize: '14', compact: false }), 'fontSize must be a number');
});

test('readSettings rejects things that are not objects at all', () => {
  throws(() => readSettings(null), 'expected an object');
  throws(() => readSettings('dark'), 'expected an object');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _s1 = Expect<
  Equal<ShapeOf<{ a: 'string'; b: 'number'; c: 'boolean' }>, { a: string; b: number; c: boolean }>
>;

function _typeTests() {
  const maybe = Math.random() > 0.5 ? 'value' : null;
  // @ts-expect-error — not narrowed yet: it may still be null
  maybe.toUpperCase();
  assertDefined(maybe);
  const sure: string = maybe;
  use(sure);

  const json: unknown = JSON.parse('{}');
  // @ts-expect-error — you cannot read a property off unknown
  json.theme;
  assertShape(json, { theme: 'string' } as const);
  const theme: string = json.theme;
  use(theme);

  // @ts-expect-error — 'str' is not one of the field types
  assertShape({}, { name: 'str' });
}
use(_typeTests);
