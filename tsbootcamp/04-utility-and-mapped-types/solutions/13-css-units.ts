// ─────────────────────────────────────────────────────────────────────────
//  13 · CSS lengths — SOLUTION                              ★★☆ core
//  run: node ../run.js solutions/13-css-units.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `type Length = `${number}${CssUnit}`` — one line, because a
//  union inside a template literal type distributes: tsc expands it to
//  `${number}px` | `${number}rem` | `${number}%`, which is what _t2 checks.
//  Three placeholders of two members each would give you eight types; that
//  blow-up is real and is why tsc caps template literal unions at 100k
//  members.
//
//  Going the other way, `return `${n * factor}${unit}`` type-checks with
//  NO cast. A template literal expression normally widens to `string`, but
//  when it is contextually typed by a template literal type tsc keeps the
//  precise type and checks the pieces. Change `unit` to `string` and watch
//  the return stop compiling — that is the check doing its job.
//
//  Two honest limits of `${number}`:
//
//  1. It accepts any text a numeric literal can have — `'1e3px'` and
//     `'0x10px'` are Lengths. It is a shape check, not a validator.
//  2. It does not prove the runtime string is one. Anything crossing a
//     network boundary still needs a real parse; `Length` is for values
//     your own code builds and passes around.
//
//  parseLength leans on the fact that the units are unambiguous suffixes,
//  so `endsWith` is enough and no regex is needed.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type CssUnit = 'px' | 'rem' | '%';
export type Length = `${number}${CssUnit}`;

export interface ParsedLength {
  value: number;
  unit: CssUnit;
}

export function parseLength(input: Length): ParsedLength {
  const unit: CssUnit = input.endsWith('px')
    ? 'px'
    : input.endsWith('rem')
      ? 'rem'
      : '%';
  return { value: Number(input.slice(0, input.length - unit.length)), unit };
}

export function scale(input: Length, factor: number): Length {
  const { value, unit } = parseLength(input);
  return `${value * factor}${unit}`;
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
