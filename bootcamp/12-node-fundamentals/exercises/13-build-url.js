// ─────────────────────────────────────────────────────────────────────────
//  13 · build URLs                                            ★★☆ core
//  concepts: URL · URLSearchParams · encoding query values
//  run: node 13-build-url.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The other half of the job: assembling a request URL from a base, a
//  path and a bag of params, without producing '//users' or forgetting to
//  escape a space.
//
//      buildUrl('https://api.example.com', '/users', { page: 2 })
//        → 'https://api.example.com/users?page=2'
//      buildUrl('https://api.example.com/v1/', 'users')
//        → 'https://api.example.com/v1/users'
//      buildUrl(base, '/search', { tag: ['a', 'b'], q: null })
//        → '...?tag=a&tag=b'          (null and undefined are dropped)
//
//      mergeParams('https://x.dev/a?page=1&sort=name', { page: 3 })
//        → 'https://x.dev/a?page=3&sort=name'
//      mergeParams(href, { sort: null })   → removes sort entirely
//
//  Exactly one '/' joins the base path and the path, whichever of them
//  brought a slash. Array values repeat the key. Numbers become strings.
//
//  hint: build a URL object from the base, edit url.pathname and
//  url.searchParams in place, and return url.toString() at the end.

import { test, eq } from '../../_lib/check.js';

export function buildUrl(base, pathname, params = {}) {
  throw new Error('TODO');
}

export function mergeParams(href, extra) {
  throw new Error('TODO');
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
