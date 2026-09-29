// ─────────────────────────────────────────────────────────────────────────
//  01 · primitive annotations                              ★☆☆ warm-up
//  concepts: primitives · annotations · inference
//  run: node ../run.js exercises/01-primitive-annotations.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Five bindings for a tiny app config. TypeScript already knows the type
//  of every literal you write, so half this job is DELETING `: TODO` and
//  letting inference work. The other half is annotating the two places
//  where inference lands somewhere you don't want.
//
//      appName     const 'ts-bootcamp'  → exactly 'ts-bootcamp'
//      version     const '1.0.0'        → string
//      retryLimit  let   3              → number
//      debugMode   const false          → boolean
//      maxBytes    const 1024           → exactly 1024
//
//  Then implement configLine():
//
//      configLine()   → 'ts-bootcamp@1.0.0 retries=3'
//
//  hint: a `const` holding a literal infers the LITERAL type; annotating
//  it with the wider type is how you opt out of that

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export const appName: TODO = 'ts-bootcamp';
export const version: TODO = '1.0.0';
export let retryLimit: TODO = 3;
export const debugMode: TODO = false;
export const maxBytes: TODO = 1024;

export function configLine(): TODO {
  throw new Error('TODO');
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
