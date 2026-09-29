// ─────────────────────────────────────────────────────────────────────────
//  02 · inference and widening — SOLUTION                  ★☆☆ warm-up
//  run: node ../run.js solutions/02-inference-and-widening.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the widening rule follows mutability. `MODE` can never be
//  reassigned, so 'dark' is a safe type for it. `cursorMode` is a `let`,
//  so TypeScript widens to string — otherwise the very next assignment
//  would fail. Inside `theme` the properties are mutable, so they widen
//  the same way; `theme.name` is string even though the object is const.
//  Array literals widen element-by-element and become arrays, never
//  tuples: `[1, 2, 3]` is `number[]`, not `[1, 2, 3]`.
//
//  `method` is the one annotation. Written bare it would infer `string`
//  and accept 'PUT'; annotated `'GET' | 'POST'` the compiler pins it to
//  the two values the API actually supports. That is the shape of most
//  real annotations: not "tell TS what it already knows", but "tell TS
//  something it cannot see from the initial value".
//
//  (Module 12's `as const` is the other lever — it stops widening for a
//  whole object at once.)

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export const MODE = 'dark';
export let cursorMode = 'dark';
export const theme = { name: 'dark', level: 3 };
export const levels = [1, 2, 3];
export let method: 'GET' | 'POST' = 'GET';

export function themeLine(): string {
  return `${theme.name}:${theme.level}`;
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('MODE is the dark theme', () => {
  eq(MODE, 'dark');
});

test('levels holds the three levels', () => {
  eq(levels, [1, 2, 3]);
});

test('themeLine joins the theme name and level', () => {
  eq(themeLine(), 'dark:3');
});

test('themeLine reads the theme object, not a hard-coded string', () => {
  theme.level = 9;
  try {
    eq(themeLine(), 'dark:9');
  } finally {
    theme.level = 3;
  }
});

// ──────────────────────────── type tests ─────────────────────────────────

type _1 = Expect<Equal<typeof MODE, 'dark'>>;
type _2 = Expect<Equal<typeof cursorMode, string>>;
type _3 = Expect<Equal<typeof theme, { name: string; level: number }>>;
type _4 = Expect<Equal<typeof levels, number[]>>;
type _5 = Expect<Equal<ReturnType<typeof themeLine>, string>>;

function _typeTests() {
  // at module scope `typeof method` narrows to the assigned 'GET'; the
  // declared union is what a function body sees, so pin it in here:
  type _6 = Expect<Equal<typeof method, 'GET' | 'POST'>>;

  cursorMode = 'light'; // a widened let accepts any string
  method = 'POST'; // both members of the union are fine

  // @ts-expect-error — 'PUT' is not one of the two literals
  method = 'PUT';

  // @ts-expect-error — theme.name widened to string, so it is not 'dark'
  const exact: 'dark' = theme.name;
  use(exact);

  // @ts-expect-error — levels is number[], never a tuple of literals
  const tuple: [1, 2, 3] = levels;
  use(tuple);
}
use(_typeTests);
