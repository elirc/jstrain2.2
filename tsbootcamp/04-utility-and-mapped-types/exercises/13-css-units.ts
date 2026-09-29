// ─────────────────────────────────────────────────────────────────────────
//  13 · CSS lengths                                         ★★☆ core
//  concepts: template literal types · ${number} · parsing back out
//  run: node ../run.js exercises/13-css-units.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  `'12px'` is a string, and `string` is a terrible type for it — every
//  typo compiles. A template literal type describes the SHAPE of the
//  string instead, and `${number}` is a placeholder for any numeric text.
//
//      type Length = `${number}px` | `${number}rem` | `${number}%`
//
//      '12px'   ✔        '12em'   ✘ (unknown unit)
//      '1.5rem' ✔        '12'     ✘ (no unit)
//      '100%'   ✔        'px'     ✘ (no number)
//
//  Build CssUnit and Length, then parseLength (string → number + unit) and
//  scale (multiply and put it back together).
//
//  hint: a template literal type distributes over a union placeholder, so
//  `${number}${CssUnit}` IS the three-way union — and going the other way,
//  a template literal EXPRESSION contextually typed by Length keeps its
//  precise type, so `return \`${n}${unit}\`` needs no cast

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type CssUnit = TODO;
export type Length = TODO;

export interface ParsedLength {
  value: number;
  unit: CssUnit;
}

export function parseLength(input: Length): ParsedLength {
  throw new Error('TODO');
}

export function scale(input: Length, factor: number): Length {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('parses pixels', () => {
  eq(parseLength('12px'), { value: 12, unit: 'px' });
});

test('parses fractional rems and percentages', () => {
  eq(parseLength('1.5rem'), { value: 1.5, unit: 'rem' });
  eq(parseLength('100%'), { value: 100, unit: '%' });
});

test('parses a negative length', () => {
  eq(parseLength('-4px'), { value: -4, unit: 'px' });
});

test('scale multiplies and keeps the unit', () => {
  eq(scale('12px', 2), '24px');
  eq(scale('1.5rem', 2), '3rem');
});

test('scaling by zero is still a length', () => {
  eq(scale('100%', 0), '0%');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _t1 = Expect<Equal<CssUnit, 'px' | 'rem' | '%'>>;
type _t2 = Expect<
  Equal<Length, `${number}px` | `${number}rem` | `${number}%`>
>;
type _t3 = Expect<Equal<ReturnType<typeof scale>, Length>>;

function _typeTests() {
  const a: Length = '12px';
  const b: Length = '1.5rem';
  const c: Length = '100%';
  const d: Length = '-4px';
  use(a, b, c, d);

  // ${number} means "numeric literal text", which is wider than you think
  const scientific: Length = '1e3px';
  use(scientific);

  const unit: CssUnit = parseLength('12px').unit;
  use(unit);

  // @ts-expect-error — em is not one of the units
  parseLength('12em');

  // @ts-expect-error — a bare number is not a length
  parseLength('12');

  // @ts-expect-error — a bare unit is not a length either
  parseLength('px');

  // @ts-expect-error — and the number part really is checked
  parseLength('twelvepx');
}
use(_typeTests);
