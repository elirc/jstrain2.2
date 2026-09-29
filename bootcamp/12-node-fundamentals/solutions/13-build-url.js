// ─────────────────────────────────────────────────────────────────────────
//  13 · build URLs — SOLUTION                                 ★★☆ core
//  run: node 13-build-url.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: strip a trailing '/' from the base path and force a
//  leading '/' on the incoming path — then the join is a plain '+' and
//  neither '//users' nor 'v1users' is reachable.
//  The tempting one-liner `new URL('/users', base)` looks equivalent but
//  is not: an absolute path REPLACES the base path, so any '/v1' prefix
//  silently disappears.
//  For params, set() replaces and append() adds — arrays want append so
//  the key repeats. URLSearchParams does the escaping, which is why a
//  space arrives as '+' and a '/' inside a value as '%2F'.
//  mergeParams treats null as "delete", the only sane way to express
//  removal in a plain object of updates.

import { test, eq } from '../../_lib/check.js';

export function buildUrl(base, pathname, params = {}) {
  const url = new URL(base);
  const left = url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;
  const right = pathname.startsWith('/') ? pathname : `/${pathname}`;
  url.pathname = left + right;

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) url.searchParams.append(key, String(item));
    } else {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export function mergeParams(href, extra) {
  const url = new URL(href);
  for (const [key, value] of Object.entries(extra)) {
    if (value === null) url.searchParams.delete(key);
    else if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

// ──────────────────────────── tests ──────────────────────────────────────

test('joins the base and the path', () => {
  eq(buildUrl('https://api.example.com', '/users'), 'https://api.example.com/users');
});

test('never produces a double slash', () => {
  eq(buildUrl('https://api.example.com/v1/', 'users'), 'https://api.example.com/v1/users');
  eq(buildUrl('https://api.example.com/v1/', '/users'), 'https://api.example.com/v1/users');
});

test('appends query params', () => {
  eq(
    buildUrl('https://api.example.com', '/users', { page: 2, sort: 'name' }),
    'https://api.example.com/users?page=2&sort=name'
  );
});

test('drops null and undefined params', () => {
  eq(
    buildUrl('https://api.example.com', '/users', { page: 2, q: null, x: undefined }),
    'https://api.example.com/users?page=2'
  );
});

test('repeats an array param', () => {
  eq(
    buildUrl('https://api.example.com', '/search', { tag: ['a', 'b'] }),
    'https://api.example.com/search?tag=a&tag=b'
  );
});

test('escapes values that need it', () => {
  eq(
    buildUrl('https://api.example.com', '/search', { q: 'red shoes', path: 'a/b' }),
    'https://api.example.com/search?q=red+shoes&path=a%2Fb'
  );
});

test('mergeParams overwrites one param and keeps the rest', () => {
  eq(
    mergeParams('https://x.dev/a?page=1&sort=name', { page: 3 }),
    'https://x.dev/a?page=3&sort=name'
  );
});

test('mergeParams removes a param set to null', () => {
  eq(mergeParams('https://x.dev/a?page=1&sort=name', { sort: null }), 'https://x.dev/a?page=1');
});
