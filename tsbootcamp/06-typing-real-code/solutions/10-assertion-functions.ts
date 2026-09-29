// ─────────────────────────────────────────────────────────────────────────
//  10 · assertion functions in practice — SOLUTION         ★★☆ core
//  run: node ../run.js solutions/10-assertion-functions.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `asserts value is T` is a promise with a runtime price.
//  The compiler takes your word for it and narrows everything after the
//  call; in exchange your body MUST throw when the claim is false. A
//  guard (`value is T`) returns a boolean you have to branch on; an
//  assertion reads as a straight line, which is why validation code at
//  the top of a function looks so much better with it.
//
//  `assertDefined<T>(value: T): asserts value is NonNullable<T>` is the
//  one you will write most. Generic in T so it keeps the input type —
//  narrowing `string | null` to `string` rather than to some `object`.
//
//  `assertShape` is a schema-lite: the schema is a map of field name →
//  tag string, and `ShapeOf<S>` is the mapped type that turns those tags
//  into real types. `as const` at the call site keeps 'string' a literal
//  instead of widening to `string`, which is what makes the conditional
//  in ShapeOf resolve. This is the shape every runtime validator (zod,
//  valibot, ajv wrappers) has underneath — a value that describes a type,
//  plus a type-level function that reads it.
//
//  Two rules that bite: an assertion function needs an explicit return
//  annotation (TS will never infer one), and the thing you call must be
//  a name with a declared type — `const check = assertDefined; check(x)`
//  narrows nothing.
//
//  `typeof record[key] !== want` works because the runtime tag strings
//  and `typeof`'s results were chosen to be the same words. That is not a
//  coincidence, it is the design.

import { test, eq, ok, throws } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type FieldType = 'string' | 'number' | 'boolean';
export type Schema = Record<string, FieldType>;

export type ShapeOf<S extends Schema> = {
  [K in keyof S]: S[K] extends 'string'
    ? string
    : S[K] extends 'number'
      ? number
      : boolean;
};

export function assertDefined<T>(
  value: T,
  label = 'value'
): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new TypeError(`${label} is ${String(value)}`);
  }
}

export function assertShape<S extends Schema>(
  value: unknown,
  schema: S
): asserts value is ShapeOf<S> {
  if (typeof value !== 'object' || value === null) {
    throw new TypeError('expected an object');
  }
  const record = value as Record<string, unknown>;
  for (const [key, want] of Object.entries(schema) as Array<[string, FieldType]>) {
    if (typeof record[key] !== want) {
      throw new TypeError(`${key} must be a ${want}`);
    }
  }
}

export interface Settings {
  theme: string;
  fontSize: number;
  compact: boolean;
}

// these two are complete — they are what the assertions are FOR.
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
