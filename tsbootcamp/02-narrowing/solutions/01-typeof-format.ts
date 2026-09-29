// ─────────────────────────────────────────────────────────────────────────
//  01 · format — SOLUTION                                  ★☆☆ warm-up
//  run: node ../run.js solutions/01-typeof-format.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `typeof value === 'string'` is a runtime check the
//  compiler understands. Inside that branch `value` is no longer
//  `string | number | boolean` — it is `string`, so `.trim()` is legal.
//  Each check peels one member off the union; after two early returns the
//  only thing left is `boolean`, so the last line needs no check at all.
//  That final implicit narrowing is why the return type can be a plain
//  `string` with no `| undefined` — every path returns.
//
//  Classic wrong turn: `if (value)` instead of `typeof value === ...`.
//  It compiles, but 0 and '' are falsy, so it routes them to the wrong
//  branch (exercise 02 makes that mistake fail loudly).

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

// A generic identity helper. `probe(x)` has EXACTLY the type x has at
// that point, so the type tests below can read narrowed types back out.
function probe<T>(value: T): T {
  return value;
}

export function format(value: string | number | boolean): string {
  if (typeof value === 'string') return `"${value.trim()}"`;
  if (typeof value === 'number') return value.toFixed(2);
  return value ? 'yes' : 'no';
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
