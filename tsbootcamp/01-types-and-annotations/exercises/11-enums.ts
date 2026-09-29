// ─────────────────────────────────────────────────────────────────────────
//  11 · enums                                               ★★☆ core
//  concepts: numeric enums · string enums · reverse mapping
//  run: node ../run.js exercises/11-enums.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  An enum is TypeScript's one type that also emits runtime code: an
//  object exists after compilation. Fill in the two bodies:
//
//      Level   numeric: Debug, Info, Warn, Error — auto-numbered from 0
//      Color   string:  Red = 'red', Green = 'green', Blue = 'blue'
//
//      levelName(Level.Warn)   → 'Warn'    numeric enums map back
//      isLoud(Level.Error)     → true      Warn and above
//      isLoud(Level.Info)      → false
//      hex(Color.Red)          → '#ff0000'
//      colorList()             → ['red', 'green', 'blue']
//
//  Exercise 12 rebuilds Level with a plain object and `as const`. Do this
//  one first, then compare — that comparison is the actual lesson.
//
//  hint: a numeric enum's runtime object holds BOTH directions
//  (`Level[0] === 'Debug'` and `Level.Debug === 0`); a string enum holds
//  only names → values

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export enum Level {
  // TODO: Debug, Info, Warn, Error
}

export enum Color {
  // TODO: Red = 'red', Green = 'green', Blue = 'blue'
}

export function levelName(level: TODO): string {
  throw new Error('TODO');
}

export function isLoud(level: TODO): boolean {
  throw new Error('TODO');
}

export function hex(color: TODO): string {
  throw new Error('TODO');
}

export function colorList(): string[] {
  throw new Error('TODO');
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
