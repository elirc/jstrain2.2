// ─────────────────────────────────────────────────────────────────────────
//  17 · const type parameters — SOLUTION                  ★★★ stretch
//  run: node ../run.js solutions/17-const-type-params.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `<const T extends readonly string[]>` is TS 5's answer to
//  the `as const` tax from exercise 15. The modifier changes INFERENCE
//  only: at a call site with a literal argument, T is inferred as if the
//  caller had written `as const`, so `['/home', '/about']` becomes
//  `readonly ['/home', '/about']` instead of `string[]`, and the literals
//  are still there when the mapped type needs them.
//
//  Two consequences to internalise. First, the constraint must allow
//  readonly — `<const T extends string[]>` is a contradiction and every
//  call fails. Second, what you infer IS readonly, so the body can no
//  longer push or sort; copy first if you need to.
//
//  And the limit: `const` only affects how an ARGUMENT EXPRESSION is
//  inferred. Pass a variable that was already widened to `string[]` and
//  you get `string[]` back — the widening happened at the `const paths =
//  [...]` line, long before this function was reached.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export function asTuple<const T extends readonly string[]>(values: T): T {
  return values;
}

export function enumFrom<const T extends readonly string[]>(
  values: T
): { [K in T[number]]: K } {
  const out = {} as { [K in T[number]]: K };
  for (const value of values) {
    (out as Record<string, string>)[value] = value;
  }
  return out;
}

export function defineConfig<const T>(config: T): T {
  return config;
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('asTuple hands the list straight back', () => {
  eq(asTuple(['/home', '/about']), ['/home', '/about']);
});

test('enumFrom maps every name to itself', () => {
  eq(enumFrom(['red', 'green']), { red: 'red', green: 'green' });
});

test('enumFrom of one name', () => {
  eq(enumFrom(['solo']), { solo: 'solo' });
});

test('defineConfig hands the object straight back', () => {
  eq(defineConfig({ retries: 3, tag: 'api' }), { retries: 3, tag: 'api' });
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<
  Equal<ReturnType<typeof enumFrom<readonly ['a', 'b']>>, { a: 'a'; b: 'b' }>
>;

function _typeTests() {
  // no `as const` at the call site, and the literals still survive
  const routes = asTuple(['/home', '/about']);
  type _t = Expect<Equal<typeof routes, readonly ['/home', '/about']>>;
  const home: '/home' = routes[0];
  use(routes, home);

  // @ts-expect-error — what comes back is a readonly tuple; there is no push
  routes.push('/contact');

  const colors = enumFrom(['red', 'green']);
  type _e = Expect<Equal<typeof colors, { red: 'red'; green: 'green' }>>;
  use(colors);

  // @ts-expect-error — the keys are exactly the names you listed
  colors.blue;

  const config = defineConfig({ retries: 3, tag: 'api' });
  type _c = Expect<Equal<typeof config, { readonly retries: 3; readonly tag: 'api' }>>;
  use(config);

  // @ts-expect-error — `const` inference makes the properties readonly
  config.retries = 4;

  // the catch: this variable was widened to string[] before the call, and
  // `const` cannot walk that back
  const paths = ['/home', '/about'];
  const late = asTuple(paths);
  type _l = Expect<Equal<typeof late, string[]>>;
  use(late);
}
use(_typeTests);
