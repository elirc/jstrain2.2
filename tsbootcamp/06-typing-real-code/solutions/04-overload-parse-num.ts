// ─────────────────────────────────────────────────────────────────────────
//  04 · parseNum & toList — overloads — SOLUTION           ★★★ stretch
//  run: node ../run.js solutions/04-overload-parse-num.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: an overload list is a small decision table for the type
//  checker. `parseNum` has two public shapes — one argument gives a
//  `number`, two arguments with `{ nullable: true }` give `number | null`
//  — and one private implementation signature wide enough to serve both.
//  Callers never see that third signature, which is exactly why `options?:
//  { nullable?: boolean }` there is fine even though no public overload
//  allows `{ nullable: false }`.
//
//  Order matters. Overloads are tried top to bottom, first fit wins, so
//  `toList`'s array signature MUST come first: `readonly T[]` also matches
//  the second signature (`value: T` with `T = number[]`), and you would
//  silently get `number[][]`. Rule of thumb — most specific first.
//
//  Why not a conditional type instead? `parseNum` could be written as
//  `<O extends Options>(text: string, o?: O) => O extends { nullable: true
//  } ? number | null : number`, and it would work at the call site — but
//  the body then fights the conditional on every `return`, and hovering
//  the function shows a puzzle instead of two readable lines. Overloads
//  are the better tool when the arity or the shape changes; conditional
//  types win when the result is a transformation of an input type.
//
//  Two things to remember: `ReturnType<typeof parseNum>` reports only the
//  LAST overload (`number | null` here), and TS does not check that your
//  implementation actually honours each overload — the assertion-free
//  `any` return is trust, so keep the body small.

import { test, eq, ok, throws } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export function parseNum(text: string): number;
export function parseNum(text: string, options: { nullable: true }): number | null;
export function parseNum(text: string, options?: { nullable?: boolean }): number | null {
  const trimmed = text.trim();
  const value = Number(trimmed);
  if (trimmed === '' || Number.isNaN(value)) {
    if (options?.nullable) return null;
    throw new RangeError(`not a number: ${JSON.stringify(text)}`);
  }
  return value;
}

export function toList<T>(value: readonly T[]): T[];
export function toList<T>(value: T): T[];
export function toList(value: unknown): any[] {
  return Array.isArray(value) ? [...value] : [value];
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('parses a plain numeric string', () => {
  eq(parseNum('42'), 42);
});

test('trims before parsing, and handles decimals', () => {
  eq(parseNum('  7.5 '), 7.5);
});

test('throws on junk when no options are passed', () => {
  throws(() => parseNum('abc'), 'not a number');
  throws(() => parseNum(''), 'not a number');
});

test('returns null on junk when nullable is asked for', () => {
  eq(parseNum('abc', { nullable: true }), null);
  eq(parseNum('42', { nullable: true }), 42);
});

test('toList wraps a lone value', () => {
  eq(toList(3), [3]);
  eq(toList('a'), ['a']);
});

test('toList copies an array instead of nesting it', () => {
  const input = [1, 2];
  const output = toList(input);
  eq(output, [1, 2]);
  ok(output !== input, 'expected a fresh array');
});

// ──────────────────────────── type tests ─────────────────────────────────

// ReturnType sees only the LAST overload — a real gotcha worth knowing
type _o1 = Expect<Equal<ReturnType<typeof parseNum>, number | null>>;

function _typeTests() {
  const strict: number = parseNum('42');
  const loose: number | null = parseNum('42', { nullable: true });
  use(strict, loose);

  // @ts-expect-error — with nullable: true the result may be null
  const wrong: number = parseNum('42', { nullable: true });
  use(wrong);

  // @ts-expect-error — no overload accepts a number as the text
  parseNum(42);

  // @ts-expect-error — nullable: false matches no overload
  parseNum('42', { nullable: false });

  const many: number[] = toList([1, 2]);
  const one: number[] = toList(3);
  use(many, one);

  // @ts-expect-error — the array overload must win, so this is not number[][]
  const nested: number[][] = toList([1, 2]);
  use(nested);
}
use(_typeTests);
