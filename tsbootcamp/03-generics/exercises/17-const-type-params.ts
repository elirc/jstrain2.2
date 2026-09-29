// ─────────────────────────────────────────────────────────────────────────
//  17 · const type parameters                             ★★★ stretch
//  concepts: <const T> · literal inference without `as const`
//  run: node ../run.js exercises/17-const-type-params.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  TypeScript 5 added `const` type parameters: `<const T>` tells
//  inference to treat the argument as if the caller had written
//  `as const`. The API author pays once; every call site stops
//  remembering.
//
//      asTuple(['/home', '/about'])
//        → typed readonly ['/home', '/about']    (not string[])
//
//      enumFrom(['red', 'green'])
//        → { red: 'red', green: 'green' }        (no `as const` needed)
//
//      defineConfig({ retries: 3 })
//        → typed { readonly retries: 3 }         (not { retries: number })
//
//  Same three shapes as exercise 15, minus the ceremony. Note what you
//  get back is READONLY — that is the point, and it is also the catch:
//  a value that was already widened (a `string[]` variable) cannot be
//  un-widened by `const`, because the widening happened before the call.
//
//  hint: `<const T extends readonly string[]>` — the const goes before
//  the name, the constraint stays where it was

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export function asTuple(values: TODO): TODO {
  throw new Error('TODO');
}

export function enumFrom(values: TODO): TODO {
  throw new Error('TODO');
}

export function defineConfig(config: TODO): TODO {
  throw new Error('TODO');
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
