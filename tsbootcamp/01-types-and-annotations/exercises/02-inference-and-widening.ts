// ─────────────────────────────────────────────────────────────────────────
//  02 · inference and widening                             ★☆☆ warm-up
//  concepts: literal types · widening · const vs let
//  run: node ../run.js exercises/02-inference-and-widening.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Widening is the rule that decides whether `'dark'` means the string
//  'dark' or "some string". A `const` keeps the literal. A `let` widens.
//  Object properties and array elements widen too — even inside a const,
//  because the property itself is still mutable.
//
//      MODE        const 'dark'                     → 'dark'
//      cursorMode  let   'dark'                     → string
//      theme       const { name: 'dark', level: 3 } → { name: string;
//                                                       level: number }
//      levels      const [1, 2, 3]                  → number[]
//      method      let   'GET'                      → 'GET' | 'POST'
//
//  Then implement themeLine():
//
//      themeLine()   → 'dark:3'
//
//  hint: exactly one of the five bindings needs an annotation — the one
//  where the value you wrote is narrower than the values you'll allow

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export const MODE: TODO = 'dark';
export let cursorMode: TODO = 'dark';
export const theme: TODO = { name: 'dark', level: 3 };
export const levels: TODO = [1, 2, 3];
export let method: TODO = 'GET';

export function themeLine(): TODO {
  throw new Error('TODO');
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
