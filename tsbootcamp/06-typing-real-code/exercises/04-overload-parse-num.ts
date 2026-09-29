// ─────────────────────────────────────────────────────────────────────────
//  04 · parseNum & toList — overloads                      ★★★ stretch
//  concepts: function overloads · resolution order · impl signatures
//  run: node ../run.js exercises/04-overload-parse-num.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Some functions change their RESULT type based on an argument's value,
//  not just its type. A single signature cannot say that; a list of
//  overload signatures can. You write the public signatures above the
//  implementation, and the implementation signature stays private.
//
//      parseNum('42')                     → 42            (number)
//      parseNum('42', { nullable: true }) → 42            (number | null)
//      parseNum('abc')                    → throws RangeError
//      parseNum('abc', { nullable: true })→ null
//
//      toList([1, 2])                     → [1, 2]        (number[])
//      toList(3)                          → [3]           (number[])
//
//  `toList` is where ORDER bites: overloads are tried top to bottom and
//  the first one that fits wins. Put the array signature second and
//  `toList([1, 2])` resolves to the "wrap it" branch — `number[][]`.
//
//  hint: the implementation signature must be compatible with every
//  overload but is never itself callable — that is the one place where
//  `any` in a return type is normal

import { test, eq, ok, throws } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

// TODO: add the two public overload signatures above this implementation
export function parseNum(text: TODO, options?: TODO): TODO {
  throw new Error('TODO');
}

// TODO: add the two public overload signatures above this implementation
export function toList(value: TODO): TODO {
  throw new Error('TODO');
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
