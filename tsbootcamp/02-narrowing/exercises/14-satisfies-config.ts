// ─────────────────────────────────────────────────────────────────────────
//  14 · satisfies                                            ★★☆ core
//  concepts: satisfies vs annotation · keeping literal inference
//  run: node ../run.js exercises/14-satisfies-config.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  You want a routes map checked against a shape AND you want to keep the
//  exact keys, so `urlFor('profile')` compiles and `urlFor('settings')`
//  does not. An annotation gives you the check and throws away the
//  detail: `const routes: Record<string, Route>` makes every key a
//  `string`. `satisfies` gives you the check and keeps the inference.
//
//      keyof typeof routes        → 'home' | 'login' | 'profile'
//      typeof routes.home.method  → 'GET'      still the literal
//      typeof routes.home.path    → string     widened, see below
//
//      urlFor('home')          → '/'
//      requiresAuth('profile') → true
//      routeNames()            → ['home', 'login', 'profile']
//
//  Write the `Route` type, then replace `as TODO` with a `satisfies`
//  clause. hint: `satisfies Record<string, Route>` checks the whole map
//  in one line.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type Route = TODO;

export const routes = {
  home: { path: '/', method: 'GET', auth: false },
  login: { path: '/login', method: 'POST', auth: false },
  profile: { path: '/profile', method: 'GET', auth: true },
} as TODO; // ← replace `as TODO` with a satisfies clause

export function urlFor(name: keyof typeof routes): string {
  throw new Error('TODO');
}

export function requiresAuth(name: keyof typeof routes): boolean {
  throw new Error('TODO');
}

export function routeNames(): string[] {
  throw new Error('TODO');
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
