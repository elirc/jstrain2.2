// ─────────────────────────────────────────────────────────────────────────
//  11 · enums — SOLUTION                                    ★★☆ core
//  run: node ../run.js solutions/11-enums.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: enums are the one TypeScript construct that survives to
//  runtime as a value. A numeric enum compiles to an object holding BOTH
//  directions — `Level.Warn === 2` and `Level[2] === 'Warn'` — which is
//  what makes `levelName` a one-liner and what makes `Object.keys(Level)`
//  return eight entries instead of four. A string enum has no reverse
//  map, so `Object.values(Color)` is exactly the three colours.
//
//  Two quirks the type tests pin down:
//    · `Level.Warn` is assignable to `number`, but `99` is NOT assignable
//      to `Level` (since TS 5.0 a literal numeric enum is a closed union).
//    · `Color.Red` is assignable to `string`, but the string `'red'` is
//      NOT assignable to `Color` — enum members are nominal, the one
//      corner of TypeScript that is not structural. Every value coming
//      from JSON has to be converted before it can enter a Color-typed
//      slot, which is the practical cost of enums at the boundary.
//
//  The exhaustive `switch` in `hex` needs no `default` and no trailing
//  return: the compiler knows the three members are all of them.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export enum Level {
  Debug,
  Info,
  Warn,
  Error,
}

export enum Color {
  Red = 'red',
  Green = 'green',
  Blue = 'blue',
}

export function levelName(level: Level): string {
  return Level[level];
}

export function isLoud(level: Level): boolean {
  return level >= Level.Warn;
}

export function hex(color: Color): string {
  switch (color) {
    case Color.Red:
      return '#ff0000';
    case Color.Green:
      return '#00ff00';
    case Color.Blue:
      return '#0000ff';
  }
}

export function colorList(): string[] {
  return Object.values(Color);
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('levelName reads the name back out of the enum', () => {
  eq(levelName(Level.Warn), 'Warn');
  eq(levelName(Level.Debug), 'Debug');
});

test('isLoud is true from Warn upwards', () => {
  eq(isLoud(Level.Error), true);
  eq(isLoud(Level.Warn), true);
  eq(isLoud(Level.Info), false);
});

test('hex maps each colour to its code', () => {
  eq(hex(Color.Red), '#ff0000');
  eq(hex(Color.Blue), '#0000ff');
});

test('colorList holds only the three values', () => {
  eq(colorList(), ['red', 'green', 'blue']);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _1 = Expect<Equal<Parameters<typeof isLoud>[0], Level>>;
type _2 = Expect<Equal<Parameters<typeof hex>[0], Color>>;

function _typeTests() {
  const asNumber: number = Level.Warn; // numeric members ARE numbers
  const asString: string = Color.Red; // string members ARE strings
  use(asNumber, asString);

  // @ts-expect-error — a bare number is not a Level
  const fake: Level = 99;
  use(fake);

  // @ts-expect-error — 'red' is not a Color, even though Color.Red is 'red'
  const wrong: Color = 'red';
  use(wrong);

  // @ts-expect-error — string enums have no reverse mapping
  Color['red'];

  const name: string = Level[0]; // numeric enums do have one
  use(name);
}
use(_typeTests);
