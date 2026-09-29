// ─────────────────────────────────────────────────────────────────────────
//  12 · satisfies for config maps — SOLUTION               ★★☆ core
//  run: node ../run.js solutions/12-satisfies-config-maps.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `satisfies` is the "check it but do not flatten it"
//  operator, and config maps are what it was invented for.
//
//    const routes: Record<string, Handler> = {...}
//      — checked, but `routes` is now literally `Record<string, Handler>`:
//        `keyof typeof routes` is `string` and every typo compiles.
//    const routes = {...} as Record<string, Handler>
//      — no check at all AND the same loss. `as` is a claim, not a test.
//    const routes = {...} satisfies Record<string, Handler>
//      — checked against the contract, typed as what you wrote.
//
//  The bonus is contextual typing: because the object literal is being
//  compared to `Record<string, Handler>`, each function gets `Handler` as
//  its contextual type, so `req` is a `Req` with no annotation. That is
//  why the starter's implicit-any error disappears the moment you add the
//  clause — one keyword fixed the keys and the parameters at once.
//
//  `Route = keyof typeof routes` then gives real literal keys, and
//  `isRoute` turns an arbitrary string into one with a predicate.
//  `Object.hasOwn` rather than `in`, so 'toString' does not sneak in
//  through the prototype — a genuine bug in router code.
//
//  Same story for the theme: `ColorName` stays `'fg' | 'bg' | 'accent'`,
//  so a component prop can be `color: ColorName` and autocomplete works,
//  while `Tokens` still guarantees every space is a number.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface Req {
  path: string;
  query: Record<string, string>;
}
export interface Res {
  status: number;
  body: string;
}
export type Handler = (req: Req) => Res;

export const routes = {
  '/': (req) => ({ status: 200, body: `home ${req.path}` }),
  '/users': (req) => ({ status: 200, body: `users:${req.query.role ?? 'all'}` }),
  '/health': () => ({ status: 204, body: '' }),
} satisfies Record<string, Handler>;

export type Route = keyof typeof routes;

export interface Tokens {
  color: Record<string, string>;
  space: Record<string, number>;
}

export const theme = {
  color: { fg: '#111827', bg: '#ffffff', accent: '#2563eb' },
  space: { sm: 4, md: 8, lg: 16 },
} satisfies Tokens;

export type ColorName = keyof typeof theme.color;

export function isRoute(path: string): path is Route {
  return Object.hasOwn(routes, path);
}

export function dispatch(req: Req): Res {
  if (!isRoute(req.path)) return { status: 404, body: 'not found' };
  const handler: Handler = routes[req.path];
  return handler(req);
}

export function cssVars(): string {
  const colors = Object.entries(theme.color).map(
    ([name, value]) => `--color-${name}:${value}`
  );
  const spaces = Object.entries(theme.space).map(
    ([name, value]) => `--space-${name}:${value}px`
  );
  return [...colors, ...spaces].join(';');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('dispatch reaches the handler that owns the path', () => {
  eq(dispatch({ path: '/', query: {} }), { status: 200, body: 'home /' });
  eq(dispatch({ path: '/health', query: {} }), { status: 204, body: '' });
});

test('dispatch hands the whole request to the handler', () => {
  eq(dispatch({ path: '/users', query: { role: 'admin' } }), {
    status: 200,
    body: 'users:admin',
  });
  eq(dispatch({ path: '/users', query: {} }), { status: 200, body: 'users:all' });
});

test('an unknown path 404s instead of throwing', () => {
  eq(dispatch({ path: '/nope', query: {} }), { status: 404, body: 'not found' });
});

test('isRoute only accepts the paths that were declared', () => {
  eq(isRoute('/users'), true);
  eq(isRoute('/nope'), false);
  eq(isRoute('toString'), false);
});

test('cssVars renders every token in the theme', () => {
  eq(
    cssVars(),
    '--color-fg:#111827;--color-bg:#ffffff;--color-accent:#2563eb;' +
      '--space-sm:4px;--space-md:8px;--space-lg:16px'
  );
});

// ──────────────────────────── type tests ─────────────────────────────────

type _c1 = Expect<Equal<Route, '/' | '/users' | '/health'>>;
type _c2 = Expect<Equal<ColorName, 'fg' | 'bg' | 'accent'>>;

function _typeTests() {
  const home: Res = routes['/']({ path: '/', query: {} });
  use(home);

  const fg: string = theme.color.fg;
  const sm: number = theme.space.sm;
  use(fg, sm);

  // @ts-expect-error — '/nope' was never declared as a route
  routes['/nope'];

  // @ts-expect-error — 'danger' is not a theme colour
  theme.color.danger;

  // @ts-expect-error — a handler must return a Res, not a string
  const broken = { '/x': () => 'oops' } satisfies Record<string, Handler>;
  use(broken);

  // @ts-expect-error — space tokens are numbers, not CSS strings
  const badTheme = { color: {}, space: { sm: '4px' } } satisfies Tokens;
  use(badTheme);
}
use(_typeTests);
