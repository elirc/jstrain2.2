// ─────────────────────────────────────────────────────────────────────────
//  01 · primitive annotations — SOLUTION                   ★☆☆ warm-up
//  run: node ../run.js solutions/01-primitive-annotations.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: inference is the default, and it is usually right. A
//  `const` bound to a literal gets the LITERAL type ('ts-bootcamp', 1024)
//  because a const can never hold anything else. A `let` widens to the
//  base type (number) because you are announcing future reassignment.
//
//  So three of these five need no annotation at all — deleting `: TODO`
//  IS the answer. The two that keep an annotation are the ones where the
//  inferred type is too narrow for the job: `version: string` because a
//  version string changes, and `debugMode: boolean` because `false`
//  alone would reject `true` forever.
//
//  The classic wrong turn is annotating everything ("it's TypeScript, so
//  types go everywhere"). Annotations you didn't need are noise that
//  drifts out of date; annotate boundaries — exported API, parameters,
//  anything whose inferred type is wrong — and let the rest infer.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export const appName = 'ts-bootcamp';
export const version: string = '1.0.0';
export let retryLimit = 3;
export const debugMode: boolean = false;
export const maxBytes = 1024;

export function configLine(): string {
  return `${appName}@${version} retries=${retryLimit}`;
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('appName holds the bootcamp name', () => {
  eq(appName, 'ts-bootcamp');
});

test('maxBytes is one kibibyte', () => {
  eq(maxBytes, 1024);
});

test('configLine renders name, version and retry limit', () => {
  eq(configLine(), 'ts-bootcamp@1.0.0 retries=3');
});

test('configLine reads retryLimit at call time', () => {
  retryLimit = 5;
  try {
    eq(configLine(), 'ts-bootcamp@1.0.0 retries=5');
  } finally {
    retryLimit = 3;
  }
});

// ──────────────────────────── type tests ─────────────────────────────────

type _1 = Expect<Equal<typeof appName, 'ts-bootcamp'>>;
type _2 = Expect<Equal<typeof version, string>>;
type _3 = Expect<Equal<typeof retryLimit, number>>;
type _4 = Expect<Equal<typeof maxBytes, 1024>>;
type _5 = Expect<Equal<ReturnType<typeof configLine>, string>>;

function _typeTests() {
  // out at module scope `typeof debugMode` reports the value it was given
  // (`false`); inside a function the DECLARED type comes back:
  type _6 = Expect<Equal<typeof debugMode, boolean>>;

  const wide: string = appName; // a literal type is assignable to string
  use(wide);

  // @ts-expect-error — appName is the literal type, so string is too wide
  const narrow: typeof appName = wide;
  use(narrow);

  // @ts-expect-error — retryLimit is a number, not a string
  retryLimit = 'three';
}
use(_typeTests);
