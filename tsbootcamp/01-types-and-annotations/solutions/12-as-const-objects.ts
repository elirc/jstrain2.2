// ─────────────────────────────────────────────────────────────────────────
//  12 · as const objects — SOLUTION                         ★★☆ core
//  run: node ../run.js solutions/12-as-const-objects.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `as const` turns off widening for the whole literal. The
//  object becomes `{ readonly debug: 10; readonly info: 20; ... }` —
//  every property readonly, every value its own literal type. Without it
//  you get `{ debug: number; ... }` and both derived types collapse to
//  `string` and `number`.
//
//  Then derive, never retype:
//    · `keyof typeof LEVEL` — typeof lifts the VALUE into a type, keyof
//      takes its keys → 'debug' | 'info' | 'warn' | 'error'.
//    · `(typeof LEVEL)[LevelName]` — indexed access with a union of keys
//      gives the union of those property types → 10 | 20 | 30 | 40.
//  Add a level to the object and both types update themselves. That is
//  the payoff; a hand-written union would silently drift.
//
//  as-const object vs enum (exercise 11), honestly:
//    · as const emits nothing extra and its values are plain numbers and
//      strings, so JSON, DB rows and `switch` all just work.
//    · an enum's members are nominal — `'red'` is not `Color.Red` — so
//      every value crossing a boundary needs converting.
//    · enums also come in `const enum` and ambient flavours, which get
//      inlined at compile time and are restricted or unsupported under
//      isolated-module builds (Babel, esbuild, `isolatedModules`).
//  Prefer the as-const object for new code. Reach for an enum when you
//  are matching an existing codebase that already uses them.
//
//  `levelNames` returns a literal array because `Object.keys(LEVEL)` is
//  typed `string[]` — TypeScript refuses to promise a key list is exact,
//  since extra properties may ride along at runtime. Writing
//  `Object.keys(LEVEL) as LevelName[]` is the usual pragmatic fix (see
//  exercise 14), and it is an assertion — a promise you are making.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export const LEVEL = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
} as const;

export type LevelName = keyof typeof LEVEL;
export type LevelValue = (typeof LEVEL)[LevelName];

export function levelValue(name: LevelName): LevelValue {
  return LEVEL[name];
}

export function isLoud(name: LevelName): boolean {
  return LEVEL[name] >= LEVEL.warn;
}

export function levelNames(): LevelName[] {
  return ['debug', 'info', 'warn', 'error'];
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
