// ─────────────────────────────────────────────────────────────────────────
//  12 · as const objects                                    ★★☆ core
//  concepts: as const · keyof typeof · indexed access
//  run: node ../run.js exercises/12-as-const-objects.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  The same four levels as exercise 11, modelled without an enum: a plain
//  object frozen with `as const`, plus two types DERIVED from it. Nothing
//  new ships to runtime, and the values stay ordinary numbers.
//
//      LEVEL        { debug: 10, info: 20, warn: 30, error: 40 } as const
//      LevelName    'debug' | 'info' | 'warn' | 'error'
//      LevelValue   10 | 20 | 30 | 40
//
//      levelValue('warn')   → 30
//      isLoud('warn')       → true      30 and above
//      isLoud('info')       → false
//      levelNames()         → ['debug', 'info', 'warn', 'error']
//
//  Add `as const` to LEVEL, then derive the two type aliases from the
//  value — never retype the names by hand, or they drift.
//
//  hint: `keyof typeof LEVEL` is the union of its keys;
//  `(typeof LEVEL)[LevelName]` is the union of its values

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

// TODO: freeze this object's types with `as const`
export const LEVEL = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export type LevelName = TODO;
export type LevelValue = TODO;

export function levelValue(name: LevelName): LevelValue {
  throw new Error('TODO');
}

export function isLoud(name: LevelName): boolean {
  throw new Error('TODO');
}

export function levelNames(): LevelName[] {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('levelValue looks the number up', () => {
  eq(levelValue('warn'), 30);
  eq(levelValue('debug'), 10);
});

test('isLoud is true from warn upwards', () => {
  eq(isLoud('error'), true);
  eq(isLoud('warn'), true);
  eq(isLoud('info'), false);
});

test('levelNames lists every key in order', () => {
  eq(levelNames(), ['debug', 'info', 'warn', 'error']);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _1 = Expect<Equal<LevelName, 'debug' | 'info' | 'warn' | 'error'>>;
type _2 = Expect<Equal<LevelValue, 10 | 20 | 30 | 40>>;
type _3 = Expect<Equal<typeof LEVEL.warn, 30>>;
type _4 = Expect<Equal<ReturnType<typeof levelValue>, LevelValue>>;

function _typeTests() {
  const thirty: 30 = LEVEL.warn; // the literal survives `as const`
  use(thirty);

  levelValue('warn');

  // @ts-expect-error — 'trace' is not one of the four names
  levelValue('trace');

  // @ts-expect-error — `as const` makes every property readonly
  LEVEL.debug = 99;

  // a plain number still works everywhere a level value is wanted
  const wide: number = levelValue('info');
  use(wide);
}
use(_typeTests);
