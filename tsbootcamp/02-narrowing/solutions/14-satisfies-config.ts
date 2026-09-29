// ─────────────────────────────────────────────────────────────────────────
//  14 · satisfies — SOLUTION                                 ★★☆ core
//  run: node ../run.js solutions/14-satisfies-config.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three ways to attach a type to a literal, and they do
//  different things.
//
//    const routes: Record<string, Route> = {...}   checks · widens keys
//    const routes = {...} as Record<string, Route> no check · lies
//    const routes = {...} satisfies Record<...>    checks · keeps keys
//
//  `satisfies` uses the target as a CONTEXTUAL type — it verifies the
//  literal against it, then throws the target away and keeps the inferred
//  type. So the map is validated and `keyof typeof routes` is still the
//  three real names, which is what makes `urlFor('settings')` a compile
//  error instead of a runtime undefined.
//
//  What contextual typing preserves is worth knowing exactly: `method`
//  stays `'GET'` because its target type is the literal union
//  `'GET' | 'POST'`, and `auth` stays `false`/`true` because `boolean` is
//  itself `true | false`. `path` widens to `string` because its target is
//  `string` — there is no literal to hold onto. Want `'/'` kept too? Then
//  the object needs `as const` as well.
//
//  Rule of thumb: `satisfies` to check a literal you also want to read
//  precisely; an annotation when you genuinely want the wider type; `as`
//  almost never.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type Route = {
  path: string;
  method: 'GET' | 'POST';
  auth: boolean;
};

export const routes = {
  home: { path: '/', method: 'GET', auth: false },
  login: { path: '/login', method: 'POST', auth: false },
  profile: { path: '/profile', method: 'GET', auth: true },
} satisfies Record<string, Route>;

export function urlFor(name: keyof typeof routes): string {
  return routes[name].path;
}

export function requiresAuth(name: keyof typeof routes): boolean {
  return routes[name].auth;
}

export function routeNames(): string[] {
  return Object.keys(routes);
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('urlFor looks up a path by name', () => {
  eq(urlFor('home'), '/');
  eq(urlFor('profile'), '/profile');
});

test('requiresAuth reads the flag', () => {
  eq(requiresAuth('profile'), true);
  eq(requiresAuth('login'), false);
});

test('routeNames lists every key', () => {
  eq(routeNames(), ['home', 'login', 'profile']);
});

test('the map really is data, not a copy per call', () => {
  eq(routeNames().length, 3);
  eq(urlFor('login'), '/login');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _keys = Expect<Equal<keyof typeof routes, 'home' | 'login' | 'profile'>>;
type _method = Expect<Equal<typeof routes.profile.method, 'GET'>>;
type _auth = Expect<Equal<typeof routes.profile.auth, true>>;
// `path` is contextually typed by `string`, so the literal '/' widens —
// satisfies keeps literals only where the target type is literal.
type _path = Expect<Equal<typeof routes.home.path, string>>;

function _typeTests() {
  const draft = { path: '/edit', method: 'PATCH', auth: true };

  // @ts-expect-error — 'PATCH' is not one of Route['method']
  const checked = draft satisfies Route;
  use(checked);

  // @ts-expect-error — 'settings' is not a route name
  urlFor('settings');
}
use(_typeTests);
