// ─────────────────────────────────────────────────────────────────────────
//  31 · resolve relative URLs                                ★☆☆ warm-up
//  concepts: new URL(ref, base) · relative references
//  run: node 31-url-resolve.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Every href in a page, every `Location:` header and every link in an
//  API response can be relative. Turning it into something you can fetch
//  is one constructor call — but the rules surprise people.
//
//      resolveUrl('https://x.dev/v1/users', 'me')  → 'https://x.dev/v1/me'
//      resolveUrl('https://x.dev/v1/', 'me')       → 'https://x.dev/v1/me'
//      resolveUrl('https://x.dev/v1/users', '/health')
//        → 'https://x.dev/health'          (an absolute path drops /v1)
//      resolveUrl('https://x.dev/a/b/c', '../d')   → 'https://x.dev/a/d'
//
//  resolveUrl returns the full href as a string. resolveAll does the same
//  for a list of references against one base, in order.

import { test, eq } from '../../_lib/check.js';

export function resolveUrl(base, reference) {
  throw new Error('TODO');
}

export function resolveAll(base, references) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a bare name replaces the last segment of the base', () => {
  eq(resolveUrl('https://x.dev/v1/users', 'me'), 'https://x.dev/v1/me');
});

test('a base ending in a slash keeps its whole path', () => {
  eq(resolveUrl('https://x.dev/v1/', 'me'), 'https://x.dev/v1/me');
  eq(resolveUrl('https://x.dev/a/b', 'sub/deep'), 'https://x.dev/a/sub/deep');
});

test('a reference starting with / throws the base path away', () => {
  eq(resolveUrl('https://x.dev/v1/users', '/health'), 'https://x.dev/health');
});

test('../ climbs one directory', () => {
  eq(resolveUrl('https://x.dev/a/b/c', '../d'), 'https://x.dev/a/d');
  eq(resolveUrl('https://x.dev/a/b/c', './d'), 'https://x.dev/a/b/d');
});

test('an absolute reference ignores the base completely', () => {
  eq(
    resolveUrl('https://x.dev/v1/', 'https://other.dev/z'),
    'https://other.dev/z'
  );
});

test('query-only and fragment-only references keep the path', () => {
  const base = 'https://x.dev/v1/users?page=2';
  eq(resolveUrl(base, '?page=3'), 'https://x.dev/v1/users?page=3');
  eq(resolveUrl(base, '#top'), 'https://x.dev/v1/users?page=2#top');
});

test('resolveAll walks a list against one base', () => {
  eq(
    resolveAll('https://x.dev/docs/guide/', ['intro', '../index.html', '//cdn.dev/a.png']),
    [
      'https://x.dev/docs/guide/intro',
      'https://x.dev/docs/index.html',
      'https://cdn.dev/a.png',
    ]
  );
  eq(resolveAll('https://x.dev/', []), []);
});
