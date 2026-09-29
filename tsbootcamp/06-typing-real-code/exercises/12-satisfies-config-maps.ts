// ─────────────────────────────────────────────────────────────────────────
//  12 · satisfies for config maps                          ★★☆ core
//  concepts: satisfies vs as vs annotation · keyof typeof
//  run: node ../run.js exercises/12-satisfies-config-maps.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  You have a config object and a contract it must obey. Three ways to
//  connect them, and only one keeps both halves:
//
//      const routes: Record<string, Handler> = {...}   checked, keys lost
//      const routes = {...} as Record<string, Handler> unchecked AND lost
//      const routes = {...} satisfies Record<string, Handler>  ✔ both
//
//  `satisfies` checks the value against the type and then throws the type
//  away, keeping whatever was inferred. So `keyof typeof routes` is still
//  `'/' | '/users' | '/health'` — and the handler parameters are still
//  contextually typed, which is why `req` needs no annotation.
//
//      dispatch({ path: '/', query: {} })        → { status: 200, ... }
//      dispatch({ path: '/nope', query: {} })    → 404
//      isRoute('/users')                         → true (and narrows)
//      cssVars()  → '--color-fg:#111827;--color-bg:#ffffff;...'
//
//  Two maps to wire up, then three functions on top of them.
//
//  hint: the starter has an implicit-any error on `req` — the same
//  keyword that fixes the keys fixes that too, because contextual typing
//  flows from whatever you satisfy

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export interface Req {
  path: string;
  query: Record<string, string>;
}
export interface Res {
  status: number;
  body: string;
}
export type Handler = TODO;

export const routes = {
  '/': (req) => ({ status: 200, body: `home ${req.path}` }),
  '/users': (req) => ({ status: 200, body: `users:${req.query.role ?? 'all'}` }),
  '/health': () => ({ status: 204, body: '' }),
};
// TODO ↑ one clause here types `req` AND keeps the keys literal

export type Route = TODO;

export interface Tokens {
  color: TODO;
  space: TODO;
}

export const theme = {
  color: { fg: '#111827', bg: '#ffffff', accent: '#2563eb' },
  space: { sm: 4, md: 8, lg: 16 },
};
// TODO ↑ same clause, same reason

export type ColorName = TODO;

export function isRoute(path: TODO): TODO {
  throw new Error('TODO');
}

export function dispatch(req: TODO): TODO {
  throw new Error('TODO');
}

export function cssVars(): TODO {
  throw new Error('TODO');
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
