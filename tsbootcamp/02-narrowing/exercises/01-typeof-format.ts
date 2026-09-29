// ─────────────────────────────────────────────────────────────────────────
//  01 · format                                            ★☆☆ warm-up
//  concepts: typeof narrowing · union parameters
//  run: node ../run.js exercises/01-typeof-format.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  One parameter, three shapes. `format` renders a string, a number and a
//  boolean differently. The compiler only lets you call `.trim()` or
//  `.toFixed()` once it KNOWS which one you are holding — a `typeof`
//  check is how you tell it.
//
//      format('  hi  ')  → '"hi"'     trimmed, then quoted
//      format(3.5)       → '3.50'     always two decimals
//      format(true)      → 'yes'      'no' for false
//
//  Give the parameter and the return type real types, then narrow.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

// A generic identity helper. `probe(x)` has EXACTLY the type x has at
// that point, so the type tests below can read narrowed types back out.
function probe<T>(value: T): T {
  return value;
}

export function format(value: TODO): TODO {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('trims and quotes a string', () => {
  eq(format('  hi  '), '"hi"');
});

test('an empty string is still a string', () => {
  eq(format(''), '""');
});

test('pads a number to two decimals', () => {
  eq(format(3.5), '3.50');
});

test('zero is a number, not "missing"', () => {
  eq(format(0), '0.00');
});

test('renders booleans as yes / no', () => {
  eq(format(true), 'yes');
  eq(format(false), 'no');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<Equal<ReturnType<typeof format>, string>>;
type _r2 = Expect<
  Equal<Parameters<typeof format>[0], string | number | boolean>
>;

function _typeTests() {
  const value = '' as unknown as Parameters<typeof format>[0];

  if (typeof value === 'string') {
    const p = probe(value);
    type _s = Expect<Equal<typeof p, string>>;
    use(p);
  } else if (typeof value === 'number') {
    const p = probe(value);
    type _n = Expect<Equal<typeof p, number>>;
    use(p);
  } else {
    const p = probe(value);
    type _b = Expect<Equal<typeof p, boolean>>;
    use(p);
  }

  // @ts-expect-error — null is not one of the three accepted types
  format(null);
}
use(_typeTests);
